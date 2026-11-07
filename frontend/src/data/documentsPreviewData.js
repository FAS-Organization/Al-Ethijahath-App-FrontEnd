import { PREVIEW_REGION } from './customerPreviewData'
import { INSPECTIONS_PREVIEW_DATA } from './inspectionsPreviewData'
import { SERVICES_PREVIEW_DATA } from './servicesPreviewData'
import { createDemoQuotations } from './quotationsPreviewData'
import { INVOICES_PREVIEW_DATA } from './invoicesPreviewData'
import { MAINTENANCE_PREVIEW_DATA } from './maintenancePreviewData'

/*
 * Frontend archive adapter.
 *
 * These are display records assembled from the existing fictional data.
 * They are not an existing Django API response.
 *
 * Later, Django must return only documents the authenticated customer
 * is authorized to access, with authorized file URLs.
 *
 * Keep document publication, source approval and signature evidence separate.
 * A generated PDF being ready does not prove customer approval or signing.
 */

function archiveRecord(values) {
  return {
    version: null,
    previous_version: false,
    date: null,
    date_label: 'Document date',
    site_names: [],
    equipment: '',
    asset_number: '',
    reference: '',
    source_status: '',
    file_url: null,
    filename: '',
    visibility: 'customer',
    details: [],
    ...values,
  }
}

export function createDocumentsPreviewData() {
  const quotations = createDemoQuotations()
  const jobs = SERVICES_PREVIEW_DATA.jobs

  const inspections = INSPECTIONS_PREVIEW_DATA.map(report =>
    archiveRecord({
      id: `inspection-document-${report.id}`,
      type: 'inspection',
      number: report.number,
      title: 'Inspection report',
      version: report.version,
      previous_version: report.status === 'superseded',
      date: report.inspected_at ?? null,
      date_label: 'Inspected',
      site_names: [report.site],
      equipment: report.equipment,
      reference: report.serviceReference,
      source_status: report.status,
      description: report.remarks,
      file_url: report.pdf_url ?? null,
      filename: `${report.number}-v${report.version}.pdf`,
      destination: '/quotations',
      destination_label: 'Open inspections & quotations',
      details: report.findings.map(finding => ({
        label: finding.component,
        value:
          `${finding.condition} · Proposed action: ` +
          `${finding.proposed_action}. ${finding.description}`,
      })),
    }),
  )

  const completionCards = jobs.flatMap(job =>
    job.machines.flatMap(machine =>
      machine.documents
        .filter(document => document.document_type === 'completion')
        .map(document =>
          archiveRecord({
            id: `completion-document-${document.id}`,
            type: 'completion',
            number: document.document_number,
            title: 'Job completion card',
            version: document.version ?? null,
            date: machine.completed_at,
            date_label: 'Service completed',
            site_names: [job.site.name],
            equipment: [
              machine.equipment.brand,
              machine.equipment.equipment_type,
              machine.equipment.model_name,
            ].filter(Boolean).join(' '),
            asset_number: machine.equipment.customer_asset_number,
            reference: machine.reference,
            // Job completion alone does not establish document approval.
            source_status: '',
            description: job.description,
            file_url: document.file_url ?? null,
            filename: `${document.document_number}.pdf`,
            destination:
              `/services?service=${encodeURIComponent(machine.reference)}`,
            destination_label: 'Open service job',
            details: [
              {
                label: 'Site address recorded for the job',
                value: job.site_address_snapshot,
              },
              {
                label: 'Technician',
                value: machine.technician_name || 'Not recorded',
              },
            ],
          }),
        ),
    ),
  )

  const quotationDocuments = quotations
    .filter(quotation => quotation.status !== 'draft')
    .map(quotation => {
      const status =
        quotation.status === 'sent' &&
        new Date(quotation.expires_at).getTime() <= Date.now()
          ? 'expired'
          : quotation.status

      return archiveRecord({
        id: `quotation-document-${quotation.id}`,
        type: 'quotation',
        number: quotation.number,
        title: 'Quotation',
        version: quotation.version,
        previous_version: quotation.status === 'superseded',
        date: quotation.sent_at,
        date_label: 'Sent',
        site_names: [quotation.job_equipment.site_name],
        equipment: [
          quotation.job_equipment.equipment_name,
          quotation.job_equipment.model_name,
        ].filter(Boolean).join(' '),
        asset_number: quotation.job_equipment.asset_number,
        reference: quotation.job_equipment.reference,
        source_status: status,
        description: quotation.customer_summary,
        file_url: quotation.pdf_url ?? null,
        filename: `${quotation.number}-v${quotation.version}.pdf`,
        destination: '/quotations',
        destination_label: 'Open quotations',
        details: [
          {
            label: 'Quoted total',
            value: `${quotation.currency} ${quotation.total}`,
          },
          {
            label: 'Source inspection',
            value: quotation.inspection_reference,
          },
          {
            label: 'Terms',
            value: quotation.terms,
          },
        ],
      })
    })

  const invoices = INVOICES_PREVIEW_DATA.invoices
    .filter(invoice => invoice.status !== 'draft')
    .map(invoice =>
      archiveRecord({
        id: `invoice-document-${invoice.id}`,
        type: 'invoice',
        number: invoice.number,
        title: 'Invoice',
        date: invoice.issue_date,
        date_label: 'Issued',
        site_names: [invoice.job.site.name],
        reference: String(invoice.job.id),
        source_status: invoice.status,
        description: invoice.description,
        // pdf_available is a preview flag, not an actual downloadable URL.
        file_url: invoice.pdf_url ?? null,
        filename: `${invoice.number}.pdf`,
        destination: '/billing',
        destination_label: 'Open invoices & payments',
        details: [
          {
            label: 'Invoice total',
            value: `${invoice.currency} ${invoice.total}`,
          },
          {
            label: 'Included service references',
            value: [...new Set(
              invoice.lines.map(line => line.reference).filter(Boolean),
            )].join(', '),
          },
          ...(invoice.void_reason
            ? [{ label: 'Void reason', value: invoice.void_reason }]
            : []),
        ],
      }),
    )

  const contracts = MAINTENANCE_PREVIEW_DATA.contracts
    .filter(contract => contract.status !== 'draft')
    .map(contract => {
      const coveredIds = new Set(
        MAINTENANCE_PREVIEW_DATA.coverages
          .filter(coverage => coverage.contract_id === contract.id)
          .map(coverage => coverage.equipment_id),
      )

      const equipment = MAINTENANCE_PREVIEW_DATA.equipment.filter(
        item => coveredIds.has(item.id),
      )

      const siteIds = new Set(equipment.map(item => item.site_id))

      const siteNames = MAINTENANCE_PREVIEW_DATA.sites
        .filter(site => siteIds.has(site.id))
        .map(site => site.name)

      return archiveRecord({
        id: `contract-document-${contract.id}`,
        type: 'contract',
        number: contract.contract_number,
        title: 'AMC contract',
        date: contract.start_date,
        date_label: 'Contract starts',
        site_names: siteNames,
        equipment: equipment.map(item => item.name).join(', '),
        reference: contract.contract_number,
        source_status: contract.status,
        description:
          'Annual maintenance agreement and its recorded equipment coverage.',
        file_url: contract.pdf_url ?? null,
        filename: `${contract.contract_number}.pdf`,
        destination: '/maintenance',
        destination_label: 'Open AMC & service schedule',
        details: [
          {
            label: 'Contract period',
            value: `${contract.start_date} to ${contract.end_date}`,
          },
          {
            label: 'Default service interval',
            value: `${contract.interval_months} months`,
          },
          {
            label: 'Equipment',
            value: equipment.map(item => `${item.name} (${item.asset})`).join(', '),
          },
        ],
      })
    })

  // Existing service fixtures currently have no customer attachment files.
  // This adapter supports them without inventing photos or download URLs.
  const attachments = jobs.flatMap(job =>
    job.machines.flatMap(machine =>
      (machine.attachments ?? [])
        .filter(attachment => attachment.visibility === 'customer')
        .map(attachment =>
          archiveRecord({
            id: `attachment-${attachment.id}`,
            type: 'attachment',
            number: attachment.filename || `Attachment ${attachment.id}`,
            title: attachment.caption || 'Service attachment',
            date: attachment.created_at ?? null,
            date_label: 'Added',
            site_names: [job.site.name],
            equipment: [
              machine.equipment.brand,
              machine.equipment.equipment_type,
              machine.equipment.model_name,
            ].filter(Boolean).join(' '),
            asset_number: machine.equipment.customer_asset_number,
            reference: machine.reference,
            description: attachment.caption || 'Customer-visible service file.',
            file_url: attachment.file_url ?? null,
            filename: attachment.filename || '',
            destination:
              `/services?service=${encodeURIComponent(machine.reference)}`,
            destination_label: 'Open service job',
          }),
        ),
    ),
  )

  return {
    is_demo: true,
    company_name: 'Demo Customer Company',
    customer_name: 'Customer account',
    unread_count: 2,
    region_name: PREVIEW_REGION.name,
    documents: [
      ...inspections,
      ...completionCards,
      ...quotationDocuments,
      ...invoices,
      ...contracts,
      ...attachments,
    ],
  }
}