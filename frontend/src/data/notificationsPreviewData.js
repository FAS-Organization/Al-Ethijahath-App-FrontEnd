import { createContext } from 'react'
import { PREVIEW_REGION } from './customerPreviewData'
import { createDemoQuotations } from './quotationsPreviewData'
import { INVOICES_PREVIEW_DATA } from './invoicesPreviewData'
import { INSPECTIONS_PREVIEW_DATA } from './inspectionsPreviewData'
import { SERVICES_PREVIEW_DATA } from './servicesPreviewData'
import { MAINTENANCE_PREVIEW_DATA } from './maintenancePreviewData'

export const NotificationsPreviewContext = createContext(null)

const saudiDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Riyadh',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const saudiDateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Riyadh',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const DAY = 86_400_000

function money(amount, currency) {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
  }).format(Number(amount))
}

function formatDay(value) {
  return saudiDate.format(new Date(`${value}T12:00:00+03:00`))
}

/*
 * Preview adapter. Event names, created_at, read_at and destination_path
 * follow the Notification model. Category, priority and requires_action
 * are display fields derived from the related records.
 *
 * The production API should provide notifications scoped to the signed-in
 * recipient and current action status for each related record.
 */
export function createNotificationsPreviewData() {
  const now = new Date()
  const timestamp = now.toISOString()
  const items = []

  function add(values) {
    items.push({
      priority: 'normal',
      requires_action: false,
      positive: false,
      reference: '',
      site: '',
      created_at: timestamp,
      read_at: null,
      ...values,
    })
  }

  for (const invoice of INVOICES_PREVIEW_DATA.invoices) {
    if (invoice.status !== 'issued') continue

    const common = {
      category: 'billing',
      reference: invoice.number,
      site: invoice.job.site.name,
      destination_path: '/billing',
      action_label: 'Open invoices & payments',
    }

    if (invoice.is_overdue && Number(invoice.balance_due) > 0) {
      add({
        ...common,
        id: `overdue-${invoice.number}`,
        event_type: 'payment_overdue',
        title: 'Overdue invoice balance',
        message:
          `${invoice.number} has ${money(invoice.balance_due, invoice.currency)} remaining. ` +
          `Payment was due ${formatDay(invoice.due_date)}. Review the confirmed payments and balance before paying.`,
        priority: 'high',
        requires_action: true,
      })
    }

    add({
      ...common,
      id: `issued-${invoice.number}`,
      event_type: 'invoice_issued',
      title: 'Invoice issued',
      message:
        `${invoice.number} was issued for ${money(invoice.total, invoice.currency)}. ` +
        invoice.description,
      created_at: `${invoice.issue_date}T10:00:00+03:00`,
      read_at: timestamp,
    })

    for (const payment of invoice.payments) {
      add({
        ...common,
        id: `payment-${invoice.number}-${payment.id}`,
        event_type: 'payment_recorded',
        title: 'Payment recorded',
        message:
          `${money(payment.amount, invoice.currency)} was recorded against ${invoice.number}. ` +
          'Open billing to check the current balance and payment history.',
        created_at: payment.paid_at,
        read_at: timestamp,
        positive: true,
      })
    }
  }

  for (const quote of createDemoQuotations()) {
    const awaiting = quote.status === 'sent' && new Date(quote.expires_at) > now
    const decided = ['approved', 'rejected'].includes(quote.status)
    if (!awaiting && !decided) continue

    add({
      id: `quotation-${quote.id}`,
      event_type: awaiting ? 'quotation_sent' : 'quotation_decision',
      category: 'quotations',
      title: awaiting ? 'Quotation awaiting your approval' : `Quotation ${quote.status}`,
      message:
        `${quote.number}, version ${quote.version}, for ${quote.job_equipment.equipment_name}. ` +
        `Quoted total: ${money(quote.total, quote.currency)}. ` +
        (awaiting
          ? `Review the work and terms before ${saudiDateTime.format(new Date(quote.expires_at))} Saudi time.`
          : 'Open quotations to review the recorded decision.'),
      reference: `${quote.number} · v${quote.version}`,
      site: quote.job_equipment.site_name,
      created_at: quote.decided_at || quote.sent_at,
      read_at: awaiting ? null : timestamp,
      priority: awaiting ? 'attention' : 'normal',
      requires_action: awaiting,
      positive: quote.status === 'approved',
      destination_path: '/quotations',
      action_label: 'Open quotations',
    })
  }

  for (const report of INSPECTIONS_PREVIEW_DATA) {
    if (report.status !== 'pending_approval') continue

    add({
      id: `inspection-${report.id}`,
      event_type: 'report_approval',
      category: 'reports',
      title: 'Inspection report awaiting signature',
      message:
        `${report.number}, version ${report.version}, for ${report.equipment} is awaiting approval. ` +
        'Review the findings and signature instructions.',
      reference: report.number,
      site: report.site,
      priority: 'attention',
      requires_action: true,
      destination_path: '/quotations',
      action_label: 'Open inspections',
    })
  }

  for (const job of SERVICES_PREVIEW_DATA.jobs) {
    for (const machine of job.machines) {
      if (machine.status !== 'completed' || !machine.completed_at) continue

      const card = machine.documents.find(document =>
        document.document_type === 'completion' && document.status === 'ready',
      )
      const equipment = [
        machine.equipment.brand,
        machine.equipment.equipment_type,
      ].filter(Boolean).join(' ')

      add({
        id: `completed-${machine.reference}`,
        event_type: 'service_completed',
        category: 'services',
        title: 'Service completed',
        message:
          `Service ${machine.reference} for ${equipment} is complete.` +
          (card ? ` Completion card ${card.document_number} is listed with the service.` : ''),
        reference: machine.reference,
        site: job.site.name,
        created_at: machine.completed_at,
        read_at: timestamp,
        positive: true,
        destination_path: `/services?service=${encodeURIComponent(machine.reference)}`,
        action_label: 'Open service job',
      })
    }
  }

  const maintenance = MAINTENANCE_PREVIEW_DATA
  const scheduleDate = new Date(maintenance.now)

  for (const visit of maintenance.appointments) {
    const start = new Date(visit.scheduled_start)
    const daysAway = (start - scheduleDate) / DAY

    if (!['planned', 'confirmed'].includes(visit.status) || daysAway < 0 || daysAway > 7) {
      continue
    }

    const equipment = maintenance.equipment.find(item => item.id === visit.equipment_id)
    const site = maintenance.sites.find(item => item.id === visit.site_id)
    const reschedulePending = maintenance.reschedule_requests.some(request =>
      request.appointment_id === visit.id && request.status === 'pending',
    )

    add({
      id: `visit-${visit.id}`,
      event_type: 'upcoming_service',
      category: 'schedule',
      title: visit.status === 'confirmed' ? 'Upcoming confirmed service' : 'Upcoming planned service',
      message:
        `${equipment?.name || 'Equipment service'} is ${visit.status} for ${saudiDateTime.format(start)} Saudi time.` +
        (reschedulePending ? ' Your request to change the date is still pending.' : ''),
      reference: visit.reference,
      site: site?.name || '',
      created_at: maintenance.now,
      destination_path: '/maintenance',
      action_label: 'Open service schedule',
    })
  }

  for (const request of maintenance.reschedule_requests) {
    if (!['accepted', 'rejected'].includes(request.status)) continue

    const visit = maintenance.appointments.find(item => item.id === request.appointment_id)
    const site = maintenance.sites.find(item => item.id === visit?.site_id)

    add({
      id: `reschedule-${request.id}`,
      event_type: 'reschedule_decision',
      category: 'schedule',
      title: `Reschedule request ${request.status}`,
      message: `${request.reference}: ${request.notes || 'Open the schedule to review the response.'}`,
      reference: request.reference,
      site: site?.name || '',
      created_at: request.responded_at,
      read_at: timestamp,
      positive: request.status === 'accepted',
      destination_path: '/maintenance',
      action_label: 'Open service schedule',
    })
  }

  return {
    company_name: 'Demo Customer Company',
    customer_name: 'Customer account',
    region_name: PREVIEW_REGION.name,
    schedule_preview_date: saudiDate.format(scheduleDate),
    items: items.sort((first, second) =>
      new Date(second.created_at) - new Date(first.created_at),
    ),
  }
}