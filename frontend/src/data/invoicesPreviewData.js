// Fictional preview records for the Invoices & payments page.
// Same shape the customer API will return later (see the contract at
// the top of InvoicesPage.jsx). The builder below only exists so the
// demo numbers always add up; the real API returns finished values.

const toMinor = value => Math.round(Number(value) * 100)
const fromMinor = minor => (minor / 100).toFixed(2)

function isoDay(offset) {
  const date = new Date()
  const pad = number => String(number).padStart(2, '0')

  date.setDate(date.getDate() + offset)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function isoTime(offset, hour = 10) {
  return `${isoDay(offset)}T${String(hour).padStart(2, '0')}:00:00+03:00`
}

const REGIONS = {
  riyadh: {
    id: 1,
    name: 'Riyadh',
    currency: 'SAR',
    bank_details:
      'Bank: Demo National Bank\nAccount name: Al Ethijahath (demo)\nIBAN: SA00 0000 0000 0000 0000 0000\nSWIFT: DEMOSARI',
    payment_qr_url: null,
  },
  dammam: {
    id: 3,
    name: 'Dammam',
    currency: 'SAR',
    bank_details:
      'Bank: Demo National Bank\nAccount name: Al Ethijahath (demo)\nIBAN: SA00 1111 1111 1111 1111 1111\nSWIFT: DEMOSARI',
    // Demo placeholder only. The API returns the region's real QR image URL.
    payment_qr_url:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#fff"/><g fill="#282321"><rect x="10" y="10" width="30" height="30"/><rect x="80" y="10" width="30" height="30"/><rect x="10" y="80" width="30" height="30"/><rect x="50" y="50" width="10" height="10"/><rect x="70" y="60" width="10" height="10"/><rect x="90" y="80" width="20" height="10"/><rect x="60" y="90" width="10" height="20"/></g><g fill="#fff"><rect x="18" y="18" width="14" height="14"/><rect x="88" y="18" width="14" height="14"/><rect x="18" y="88" width="14" height="14"/></g><text x="60" y="68" font-size="9" text-anchor="middle" fill="#8f000d" font-family="Arial">DEMO</text></svg>'
      ),
  },
  qatar: {
    id: 4,
    name: 'Qatar',
    currency: 'QAR',
    bank_details:
      'Bank: Demo Qatar Bank\nAccount name: Al Ethijahath Qatar (demo)\nIBAN: QA00 0000 0000 0000 0000 0000 0000 0',
    payment_qr_url: null,
  },
}

const SITES = {
  riyadh: { id: 1, name: 'Riyadh warehouse', region: { id: 1, name: 'Riyadh' } },
  dammam: { id: 3, name: 'Dammam depot', region: { id: 3, name: 'Dammam' } },
  doha: { id: 5, name: 'Doha workshop', region: { id: 4, name: 'Qatar' } },
}

const BILL_TO = {
  name: 'Demo Customer Company',
  address: 'Demo billing address, Riyadh',
  tax_number: '300000000000003',
}

let nextId = 1

function line(reference, category, description, quantity, unitPrice) {
  return {
    id: nextId++,
    reference,
    category,
    description,
    quantity: String(quantity),
    unit_price: fromMinor(toMinor(unitPrice)),
    line_total: fromMinor(Math.round(quantity * toMinor(unitPrice))),
  }
}

function payment(amount, offset, method, reference = '') {
  return {
    id: nextId++,
    amount: fromMinor(toMinor(amount)),
    paid_at: isoTime(offset, 11),
    method,
    transaction_reference: reference,
  }
}

function invoice(config) {
  const {
    number,
    region,
    site,
    jobId,
    jobType,
    description,
    issueOffset,
    dueOffset,
    lines,
    discount = 0,
    tax = 0,
    payments = [],
    creditNotes = [],
    status = 'issued',
    voidReason = '',
    partial = null,
  } = config

  const subtotal = lines.reduce((sum, item) => sum + toMinor(item.line_total), 0)
  const total = subtotal - toMinor(discount) + toMinor(tax)
  const paid = payments.reduce((sum, item) => sum + toMinor(item.amount), 0)
  const credits = creditNotes.reduce((sum, item) => sum + toMinor(item.amount), 0)
  const balance = Math.max(0, total - credits - paid)
  const issued = status === 'issued'

  const paymentStatus = !issued
    ? 'not_payable'
    : balance === 0
      ? 'paid'
      : paid > 0
        ? 'partially_paid'
        : 'unpaid'

  return {
    id: nextId++,
    number,
    status,
    currency: region.currency,
    issue_date: isoDay(issueOffset),
    due_date: isoDay(dueOffset),
    description,
    subtotal: fromMinor(subtotal),
    discount: fromMinor(toMinor(discount)),
    tax_amount: fromMinor(toMinor(tax)),
    total: fromMinor(total),
    amount_paid: fromMinor(paid),
    balance_due: fromMinor(balance),
    payment_status: paymentStatus,
    is_overdue: issued && balance > 0 && dueOffset < 0,
    void_reason: voidReason,
    region,
    job: { id: jobId, job_type: jobType, site },
    is_partial_invoice: Boolean(partial),
    covers: partial ? partial.covers : [],
    remaining_machines: partial ? partial.remaining : [],
    bill_to: BILL_TO,
    lines,
    payments,
    credit_notes: creditNotes,
    pdf_available: issued,
  }
}

export const INVOICES_PREVIEW_DATA = {
  is_demo: true,
  company_name: 'Demo Customer Company',

  invoices: [
    // Unpaid and overdue.
    invoice({
      number: 'RYD-2399',
      region: REGIONS.riyadh,
      site: SITES.riyadh,
      jobId: 1020,
      jobType: 'service',
      description: 'Brake system repair, Toyota Forklift 8FG25',
      issueOffset: -14,
      dueOffset: -4,
      lines: [
        line('1020A', 'part', 'Brake master cylinder kit', 1, 2100),
        line('1020A', 'part', 'Brake pad set', 2, 480),
        line('1020A', 'labor', 'Labor (hours)', 4, 150),
        line('1020A', 'transport', 'Transportation of parts', 1, 250),
      ],
      tax: 586.5,
    }),

    // Partly paid, not yet due.
    invoice({
      number: 'RYD-2401',
      region: REGIONS.riyadh,
      site: SITES.riyadh,
      jobId: 1015,
      jobType: 'service',
      description: 'Generator service, Perkins Generator 1104A',
      issueOffset: -6,
      dueOffset: 9,
      lines: [
        line('1015A', 'service', 'Full generator service', 1, 1800),
        line('1015A', 'part', 'Oil and fuel filters', 1, 640),
        line('1015A', 'labor', 'Labor (hours)', 4, 150),
      ],
      tax: 456,
      payments: [payment(2000, -5, 'bank_transfer', 'TRF-88412')],
    }),

    // Partial invoice: bills 1 of 2 machines of the same job.
    invoice({
      number: 'RYD-2403',
      region: REGIONS.riyadh,
      site: SITES.riyadh,
      jobId: 1021,
      jobType: 'amc',
      description: 'Preventive maintenance, Hyster Forklift H3.0FT',
      issueOffset: -1,
      dueOffset: 14,
      lines: [line('1021A', 'service', 'Preventive maintenance visit (AMC)', 1, 1150)],
      tax: 172.5,
      partial: {
        covers: [{ reference: '1021A', label: 'Hyster Forklift H3.0FT' }],
        remaining: [{ reference: '1021B', label: 'Perkins Generator 1104A' }],
      },
    }),

    // Partly paid, overdue, with a discount and a credit note.
    invoice({
      number: 'DMM-1181',
      region: REGIONS.dammam,
      site: SITES.dammam,
      jobId: 1004,
      jobType: 'service',
      description: 'Hydraulic pump replacement, Hyster Forklift H3.0FT',
      issueOffset: -24,
      dueOffset: -9,
      lines: [
        line('1004A', 'part', 'Hydraulic pump assembly', 1, 5200),
        line('1004A', 'labor', 'Labor (hours)', 6, 150),
      ],
      discount: 200,
      tax: 885,
      payments: [payment(3000, -20, 'bank_transfer', 'TRF-77120')],
      creditNotes: [
        {
          id: nextId++,
          number: 'DMM-CN-0007',
          issued_at: isoTime(-12),
          amount: '300.00',
          reason: 'Price adjustment on labor hours.',
        },
      ],
    }),

    // Paid in full by QR.
    invoice({
      number: 'DMM-1187',
      region: REGIONS.dammam,
      site: SITES.dammam,
      jobId: 1026,
      jobType: 'amc',
      description: 'AMC visit, Hyster Forklift H3.0FT',
      issueOffset: -16,
      dueOffset: -1,
      lines: [line('1026A', 'service', 'AMC preventive visit (per contract)', 1, 1000)],
      tax: 150,
      payments: [payment(1150, -8, 'qr', 'QR-55102')],
    }),

    // Paid in full in two payments.
    invoice({
      number: 'RYD-2394',
      region: REGIONS.riyadh,
      site: SITES.riyadh,
      jobId: 1008,
      jobType: 'amc',
      description: 'AMC visit, Toyota Forklift 8FG25',
      issueOffset: -30,
      dueOffset: -15,
      lines: [line('1008A', 'service', 'AMC preventive visit (per contract)', 1, 1000)],
      tax: 150,
      payments: [
        payment(600, -25, 'cash'),
        payment(550, -18, 'bank_transfer', 'TRF-69031'),
      ],
    }),

    // Another region, another currency. Never mixed into SAR totals.
    invoice({
      number: 'DOH-0412',
      region: REGIONS.qatar,
      site: SITES.doha,
      jobId: 1030,
      jobType: 'service',
      description: 'Shutter motor replacement, industrial roller door',
      issueOffset: -3,
      dueOffset: 20,
      lines: [
        line('1030A', 'part', 'Shutter motor', 1, 1600),
        line('1030A', 'labor', 'Labor (hours)', 3, 120),
      ],
    }),

    // Void invoice (issued in error).
    invoice({
      number: 'RYD-2380',
      region: REGIONS.riyadh,
      site: SITES.riyadh,
      jobId: 1011,
      jobType: 'service',
      description: 'Conveyor belt repair',
      issueOffset: -40,
      dueOffset: -25,
      status: 'void',
      voidReason: 'Issued in error. Please disregard this invoice.',
      lines: [line('1011A', 'service', 'Belt repair', 1, 900)],
    }),
  ],
}