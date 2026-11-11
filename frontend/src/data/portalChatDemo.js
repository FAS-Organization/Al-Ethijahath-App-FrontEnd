import { GoogleGenAI } from '@google/genai'
import { DASHBOARD_PREVIEW_DATA } from './dashboardPreviewData'
import { INVOICES_PREVIEW_DATA } from './invoicesPreviewData'
import { SERVICES_PREVIEW_DATA } from './servicesPreviewData'

const { invoices } = INVOICES_PREVIEW_DATA
const openInvoices = invoices.filter(
  invoice => invoice.status === 'issued' && invoice.payment_status !== 'paid',
)

function summarizeBalances(records) {
  const totals = new Map()

  for (const invoice of records) {
    const minor = Math.round(Number(invoice.balance_due) * 100)
    totals.set(invoice.currency, (totals.get(invoice.currency) || 0) + minor)
  }

  return Array.from(totals, ([currency, minor]) => ({
    currency,
    amount: (minor / 100).toFixed(2),
  }))
}

const previewContext = {
  outstandingInvoiceBalances: summarizeBalances(openInvoices),
  overdueInvoiceBalances: summarizeBalances(
    openInvoices.filter(invoice => invoice.is_overdue),
  ),
  issuedInvoices: invoices
    .filter(invoice => invoice.status === 'issued')
    .map(invoice => ({
      number: invoice.number,
      description: invoice.description,
      currency: invoice.currency,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      balanceDue: invoice.balance_due,
      paymentStatus: invoice.payment_status,
      overdue: invoice.is_overdue,
      dueDate: invoice.due_date,
      site: invoice.job.site.name,
    })),
  chargesAwaitingInvoice: DASHBOARD_PREVIEW_DATA.pendingServiceCharges.map(charge => ({
    reference: charge.jobReference,
    description: charge.description,
    currency: 'SAR',
    amount: (charge.balanceMinor / 100).toFixed(2),
  })),
  serviceJobs: SERVICES_PREVIEW_DATA.jobs.map(job => ({
    reference: String(job.id),
    status: job.status,
    site: job.site.name,
    machines: job.machines.map(machine => ({
      reference: machine.reference,
      equipment: [
        machine.equipment.brand,
        machine.equipment.equipment_type,
        machine.equipment.model_name,
      ].filter(Boolean).join(' '),
      status: machine.status,
      latestUpdate: machine.updates[0]?.message,
      pendingActions: machine.pending_actions.map(action => action.label),
      appointment: machine.next_appointment?.scheduled_start,
    })),
  })),
}

export async function askGemini(apiKey, messages) {
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: messages.slice(-9).map(({ role, text }) => ({
      role,
      parts: [{ text }],
    })),
    config: {
      httpOptions: { timeout: 25000 },
      systemInstruction: [
        'You are the Al Ethijahath customer portal demo assistant.',
        'Answer concisely in plain text using only the fictional records below.',
        'If the records do not contain an answer, say so.',
        'For balances, use the exact supplied totals by currency.',
        'Overdue invoices are part of the outstanding balance.',
        'List charges awaiting an invoice separately.',
        'Use exact dates from the records and avoid relative dates.',
        JSON.stringify(previewContext),
      ].join('\n'),
    },
  })

  return response.text?.trim()
}