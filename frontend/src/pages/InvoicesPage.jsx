import { useEffect, useRef, useState } from 'react'
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CopyIcon,
  DownloadSimpleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MoonIcon,
  ReceiptIcon,
  SunIcon,
  WalletIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react'

import CustomerNavbar from '../components/CustomerNavbar'
import { INVOICES_PREVIEW_DATA } from '../data/invoicesPreviewData'
// Shared page shell, summary cards, tabs, search, dialog and button styles.
import './ServicesPage.css'
import './InvoicesPage.css'

// =========================================================
// FRONTEND DATA CONTRACT
//
// data = {
//   company_name: string,
//   invoices: [
//     {
//       id,
//       number,                 // e.g. 'RYD-2401' (region prefix)
//       status,                 // 'issued' | 'void'   (drafts are never sent)
//       currency,               // 'SAR' | 'AED' | 'QAR', from the region
//       issue_date, due_date,
//       description,
//       subtotal, discount, tax_amount, total,   // decimal strings
//       amount_paid, balance_due,                // decimal strings, from the server
//       payment_status,         // 'unpaid' | 'partially_paid' | 'paid' | 'not_payable'
//       is_overdue,             // computed by the server in the region's time zone
//       void_reason,
//
//       region: { id, name, currency, bank_details, payment_qr_url },
//       job: { id, job_type, site: { id, name, region: { id, name } } },
//
//       is_partial_invoice,     // bills only some machines of the job
//       covers: [{ reference, label }],
//       remaining_machines: [{ reference, label }],
//
//       bill_to: { name, address, tax_number },  // billing snapshot
//       lines: [{ id, reference, category, description,
//                 quantity, unit_price, line_total }],
//       payments: [{ id, amount, paid_at, method, transaction_reference }],
//       credit_notes: [{ id, number, issued_at, amount, reason }],
//       pdf_available,
//     }
//   ]
// }
//
// Django mapping: Invoice, InvoiceLine, Payment (posted only),
// Region (bank details and QR). Credit notes are optional until built.
//
// Rules the API must follow:
// - Only invoices of the signed-in company; never drafts.
// - Only POSTED payments. Voided entries are not shown.
// - Money is never mixed across currencies.
// - Customers cannot pay or edit here. Our team records payments.
// =========================================================

const THEME_KEY = 'ethijahath-dashboard-theme'

const JOB_TYPES = { amc: 'AMC', service: 'Service', general: 'General' }

const METHODS = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  qr: 'QR transfer',
  other: 'Other',
}

const CATEGORIES = {
  service: 'Service',
  part: 'Part',
  labor: 'Labor',
  transport: 'Transport',
  other: 'Other',
}

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
  { value: 'payments', label: 'Payment history' },
  { value: 'all', label: 'All invoices' },
]

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)

    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // Theme persistence is optional.
  }

  return 'light'
}

const toMinor = value => Math.round(Number(value || 0) * 100)

function formatMoney(value, currency) {
  const number = Number(value)

  if (!Number.isFinite(number)) return 'Not recorded'

  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Not recorded'

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit', hour12: true }
      : {}),
  }).format(parsed)
}

function statusInfo(invoice) {
  if (invoice.status === 'void') return { label: 'Void', tone: 'muted' }

  if (invoice.payment_status === 'paid') {
    return { label: 'Paid', tone: 'green' }
  }

  if (invoice.payment_status === 'partially_paid') {
    return { label: 'Partially paid', tone: 'accent' }
  }

  return { label: 'Unpaid', tone: 'accent' }
}

const isOpen = invoice =>
  invoice.status === 'issued' && invoice.payment_status !== 'paid'

// Sums one field per currency, in minor units, so currencies never mix.
function sumByCurrency(invoices, pick) {
  const totals = new Map()

  invoices.forEach(invoice => {
    totals.set(
      invoice.currency,
      (totals.get(invoice.currency) || 0) + toMinor(pick(invoice))
    )
  })

  return Array.from(totals, ([currency, minor]) => ({ currency, minor })).sort(
    (a, b) => a.currency.localeCompare(b.currency)
  )
}

function moneyList(list) {
  return list.length
    ? list.map(item => formatMoney(item.minor / 100, item.currency)).join(' · ')
    : ''
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be blocked; the text is still visible to copy.
    }
  }

  return (
    <button className="iv-copy" type="button" onClick={copy}>
      <CopyIcon size={15} aria-hidden="true" />
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  )
}

function ActionButton({ children, available, onClick, title }) {
  return (
    <button
      className="sv-action"
      type="button"
      disabled={!available}
      title={!available ? title || 'This is not connected yet.' : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function SummaryValues({ list, fallback }) {
  if (!list.length) {
    return (
      <div className="iv-values">
        <strong>{fallback}</strong>
      </div>
    )
  }

  return (
    <div className={`iv-values${list.length > 1 ? ' iv-values--multi' : ''}`}>
      {list.map(item => (
        <strong key={item.currency}>
          {formatMoney(item.minor / 100, item.currency)}
        </strong>
      ))}
    </div>
  )
}

function InvoiceCard({ invoice, onOpen, onDownloadInvoice }) {
  const status = statusInfo(invoice)
  const paid = toMinor(invoice.amount_paid)
  const balance = toMinor(invoice.balance_due)
  const base = paid + balance
  const percent = base > 0 ? Math.min(100, Math.round((paid / base) * 100)) : 0
  const issued = invoice.status === 'issued'
  const open = isOpen(invoice)

  const meterLabel =
    invoice.payment_status === 'paid'
      ? 'Fully paid'
      : invoice.payment_status === 'partially_paid'
        ? `${formatMoney(invoice.amount_paid, invoice.currency)} paid · ${formatMoney(invoice.balance_due, invoice.currency)} remaining`
        : 'Nothing paid yet'

  return (
    <article className={`sv-card iv-card${invoice.is_overdue ? ' iv-card--overdue' : ''}`}>
      <header className="sv-card-header">
        <div className="sv-card-title">
          <h2>{invoice.number}</h2>
          <p className="sv-card-meta">
            <span className="sv-card-meta-item">
              <ReceiptIcon size={15} aria-hidden="true" />
              Job {invoice.job.id} · {JOB_TYPES[invoice.job.job_type] || 'Job'}
            </span>
            <span className="sv-card-meta-item">
              <MapPinIcon size={15} aria-hidden="true" />
              {invoice.job.site.name} · {invoice.job.site.region.name}
            </span>
            <span className="sv-card-meta-item">
              <CalendarBlankIcon size={15} aria-hidden="true" />
              Issued {formatDate(invoice.issue_date)}
            </span>
          </p>
        </div>

        <div className="sv-card-badges">
          {invoice.is_partial_invoice && (
            <span className="sv-badge sv-badge--muted">Partial invoice</span>
          )}

          {invoice.is_overdue && (
            <span className="sv-badge sv-badge--alert">Overdue</span>
          )}

          <span className={`sv-badge sv-badge--${status.tone}`}>
            {status.label}
          </span>
        </div>
      </header>

      <p className="sv-description">{invoice.description}</p>

      <dl className="iv-amounts">
        <div>
          <dt>Total</dt>
          <dd>{formatMoney(invoice.total, invoice.currency)}</dd>
        </div>
        <div>
          <dt>Paid</dt>
          <dd>{formatMoney(invoice.amount_paid, invoice.currency)}</dd>
        </div>
        <div className="iv-amounts-remaining">
          <dt>Remaining</dt>
          <dd>{formatMoney(invoice.balance_due, invoice.currency)}</dd>
        </div>
        <div>
          <dt>Due date</dt>
          <dd className={invoice.is_overdue ? 'iv-late' : undefined}>
            {formatDate(invoice.due_date)}
          </dd>
        </div>
      </dl>

      {issued && (
        <div className="iv-meter-block">
          <div
            className="iv-meter"
            role="img"
            aria-label={`${percent}% of this invoice is paid`}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <p>{meterLabel}</p>
        </div>
      )}

      {invoice.status === 'void' && invoice.void_reason && (
        <p className="sv-note">Void: {invoice.void_reason}</p>
      )}

      <div className="sv-record-actions">
        <button
          className="sv-action sv-action--solid"
          type="button"
          onClick={() => onOpen(invoice, false)}
        >
          View invoice
          <ArrowRightIcon size={16} aria-hidden="true" />
        </button>

        {open && (
          <button
            className="sv-action"
            type="button"
            onClick={() => onOpen(invoice, true)}
          >
            <WalletIcon size={16} aria-hidden="true" />
            How to pay
          </button>
        )}

        {invoice.pdf_available && (
          <ActionButton
            available={Boolean(onDownloadInvoice)}
            title="PDF download is not connected yet."
            onClick={() => onDownloadInvoice?.(invoice)}
          >
            <DownloadSimpleIcon size={16} aria-hidden="true" />
            PDF
          </ActionButton>
        )}
      </div>
    </article>
  )
}

function Ledger({ rows, onOpen, onDownloadStatement }) {
  const totals = sumByCurrency(
    rows.map(row => ({ currency: row.invoice.currency, amount: row.amount })),
    item => item.amount
  )

  return (
    <section className="iv-ledger" aria-label="Payment history">
      <div className="iv-ledger-head">
        <div>
          <h2>Payment history</h2>
          <p>
            Every payment our team has confirmed against your invoices.
            {totals.length > 0 && <> Total received: <strong>{moneyList(totals)}</strong></>}
          </p>
        </div>

        <ActionButton
          available={Boolean(onDownloadStatement)}
          title="Statement of account is not connected yet."
          onClick={() => onDownloadStatement?.()}
        >
          <DownloadSimpleIcon size={16} aria-hidden="true" />
          Statement of account
        </ActionButton>
      </div>

      {!rows.length ? (
        <div className="sv-message">
          <h2>No payments recorded yet</h2>
          <p>Payments appear here after our team confirms them.</p>
        </div>
      ) : (
        <div
          className="iv-table-scroll"
          role="region"
          aria-label="Payments"
          tabIndex={0}
        >
          <table className="iv-table">
            <thead>
              <tr>
                {['Date', 'Invoice', 'Method', 'Reference', 'Amount'].map(
                  label => (
                    <th key={label} scope="col">{label}</th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <th scope="row">{formatDate(row.paid_at, true)}</th>
                  <td>
                    <button
                      className="iv-link"
                      type="button"
                      onClick={() => onOpen(row.invoice, false)}
                    >
                      {row.invoice.number}
                    </button>
                  </td>
                  <td>{METHODS[row.method] || 'Other'}</td>
                  <td>{row.transaction_reference || 'Not recorded'}</td>
                  <td className="iv-num">
                    {formatMoney(row.amount, row.invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function InvoiceDialog({ invoice, focusPay, onDownloadInvoice, onClose }) {
  const dialogRef = useRef(null)
  const status = statusInfo(invoice)
  const open = isOpen(invoice)
  const money = value => formatMoney(value, invoice.currency)
  const credits = invoice.credit_notes || []
  const creditTotal = credits.reduce((sum, item) => sum + toMinor(item.amount), 0)
  const { region } = invoice
  const hasPayDetails = Boolean(region?.bank_details || region?.payment_qr_url)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog || dialog.open) return

    dialog.showModal()

    if (focusPay) {
      requestAnimationFrame(() => {
        dialog.querySelector('#iv-pay')?.scrollIntoView({ block: 'start' })
      })
    }
  }, [focusPay])

  return (
    <dialog
      ref={dialogRef}
      className="sv-dialog iv-dialog"
      aria-labelledby="iv-dialog-title"
      onClose={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}
    >
      <div className="sv-dialog-header">
        <div>
          <h2 id="iv-dialog-title">Invoice {invoice.number}</h2>
          <p>
            Job {invoice.job.id} · {invoice.job.site.name} ·{' '}
            {invoice.job.site.region.name}
          </p>
          <div className="iv-dialog-badges">
            {invoice.is_partial_invoice && (
              <span className="sv-badge sv-badge--muted">Partial invoice</span>
            )}
            {invoice.is_overdue && (
              <span className="sv-badge sv-badge--alert">Overdue</span>
            )}
            <span className={`sv-badge sv-badge--${status.tone}`}>
              {status.label}
            </span>
          </div>
        </div>

        <button
          className="sv-close"
          type="button"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
        >
          <XIcon size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="sv-dialog-scroll">
        <dl className="iv-meta">
          <div>
            <dt>Issue date</dt>
            <dd>{formatDate(invoice.issue_date)}</dd>
          </div>
          <div>
            <dt>Due date</dt>
            <dd className={invoice.is_overdue ? 'iv-late' : undefined}>
              {formatDate(invoice.due_date)}
            </dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{invoice.currency}</dd>
          </div>
          <div>
            <dt>Billed to</dt>
            <dd>
              {invoice.bill_to?.name}
              {invoice.bill_to?.tax_number && (
                <small>Tax no. {invoice.bill_to.tax_number}</small>
              )}
            </dd>
          </div>
        </dl>

        {invoice.is_partial_invoice && (
          <p className="iv-callout">
            <strong>Partial invoice.</strong> This bills{' '}
            {invoice.covers.map(item => item.reference).join(', ')} only.
            {invoice.remaining_machines.length > 0 && (
              <>
                {' '}
                {invoice.remaining_machines
                  .map(item => item.reference)
                  .join(', ')}{' '}
                will be invoiced separately when that work is complete.
              </>
            )}
          </p>
        )}

        <section aria-labelledby="iv-lines-title">
          <h3 id="iv-lines-title">What is billed</h3>

          <div
            className="iv-table-scroll"
            role="region"
            aria-label="Invoice lines"
            tabIndex={0}
          >
            <table className="iv-table iv-lines">
              <thead>
                <tr>
                  <th scope="col">Description</th>
                  <th scope="col" className="iv-num">Qty</th>
                  <th scope="col" className="iv-num">Unit price</th>
                  <th scope="col" className="iv-num">Amount</th>
                </tr>
              </thead>

              <tbody>
                {invoice.lines.map(item => (
                  <tr key={item.id}>
                    <th scope="row">
                      {item.description}
                      <small>
                        {CATEGORIES[item.category] || 'Other'}
                        {item.reference ? ` · ${item.reference}` : ''}
                      </small>
                    </th>
                    <td className="iv-num">{Number(item.quantity)}</td>
                    <td className="iv-num">{money(item.unit_price)}</td>
                    <td className="iv-num">{money(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="iv-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(invoice.subtotal)}</dd>
            </div>
            {toMinor(invoice.discount) > 0 && (
              <div>
                <dt>Discount</dt>
                <dd>−{money(invoice.discount)}</dd>
              </div>
            )}
            <div>
              <dt>Tax</dt>
              <dd>{money(invoice.tax_amount)}</dd>
            </div>
            <div className="iv-totals-strong">
              <dt>Invoice total</dt>
              <dd>{money(invoice.total)}</dd>
            </div>
            {creditTotal > 0 && (
              <div>
                <dt>Credit notes</dt>
                <dd>−{money(creditTotal / 100)}</dd>
              </div>
            )}
            <div>
              <dt>Payments received</dt>
              <dd>−{money(invoice.amount_paid)}</dd>
            </div>
            <div className="iv-totals-strong iv-totals-remaining">
              <dt>Remaining to pay</dt>
              <dd>{money(invoice.balance_due)}</dd>
            </div>
          </dl>
        </section>

        {credits.length > 0 && (
          <section aria-labelledby="iv-credits-title">
            <h3 id="iv-credits-title">Credit notes</h3>
            <ul className="iv-list">
              {credits.map(item => (
                <li key={item.id}>
                  <div>
                    <strong>{item.number}</strong>
                    <span>
                      {formatDate(item.issued_at)}
                      {item.reason ? ` · ${item.reason}` : ''}
                    </span>
                  </div>
                  <b>−{money(item.amount)}</b>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="iv-payments-title">
          <h3 id="iv-payments-title">Payments on this invoice</h3>

          {invoice.payments.length ? (
            <ul className="iv-list">
              {invoice.payments.map(item => (
                <li key={item.id}>
                  <div>
                    <strong>{formatDate(item.paid_at, true)}</strong>
                    <span>
                      {METHODS[item.method] || 'Other'}
                      {item.transaction_reference
                        ? ` · Ref ${item.transaction_reference}`
                        : ''}
                    </span>
                  </div>
                  <b>{money(item.amount)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sv-note">No payments recorded yet.</p>
          )}
        </section>

        {open && (
          <section className="iv-pay" id="iv-pay" aria-labelledby="iv-pay-title">
            <h3 id="iv-pay-title">How to pay</h3>
            <p>
              Pay all or part of the remaining{' '}
              <strong>{money(invoice.balance_due)}</strong>. Please use{' '}
              <strong>{invoice.number}</strong> as the payment reference.
            </p>

            {hasPayDetails ? (
              <div className="iv-pay-grid">
                {region.payment_qr_url && (
                  <figure>
                    <img
                      src={region.payment_qr_url}
                      width="150"
                      height="150"
                      alt={`Payment QR code for ${region.name}`}
                    />
                    <figcaption>Scan to pay ({region.name})</figcaption>
                  </figure>
                )}

                {region.bank_details && (
                  <div>
                    <h4>Bank transfer</h4>
                    <pre>{region.bank_details}</pre>
                    <div className="iv-copy-row">
                      <CopyButton text={region.bank_details} label="Copy bank details" />
                      <CopyButton text={invoice.number} label="Copy invoice number" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="sv-note">
                Contact our team for payment details.
              </p>
            )}

            <ul className="iv-steps-list">
              <li>To pay in cash, contact our team and we will arrange collection.</li>
              <li>
                Our team records your payment after confirming it, so it can
                take a short while to appear here.
              </li>
              <li>
                You can pay in parts. The remaining balance updates after each
                confirmed payment.
              </li>
            </ul>
          </section>
        )}

        {invoice.payment_status === 'paid' && (
          <p className="iv-callout iv-callout--green">
            <CheckCircleIcon size={20} weight="fill" aria-hidden="true" />
            This invoice is fully paid. Paid invoices are final.
          </p>
        )}

        {invoice.status === 'void' && (
          <p className="iv-callout">
            <strong>This invoice is void.</strong>{' '}
            {invoice.void_reason || 'No payment is needed.'}
          </p>
        )}
      </div>

      <div className="sv-dialog-footer">
        <ActionButton
          available={invoice.pdf_available && Boolean(onDownloadInvoice)}
          title="PDF download is not connected yet."
          onClick={() => onDownloadInvoice?.(invoice)}
        >
          <DownloadSimpleIcon size={16} aria-hidden="true" />
          Download PDF
        </ActionButton>

        <button
          className="sv-primary"
          type="button"
          onClick={() => dialogRef.current?.close()}
        >
          Close
        </button>
      </div>
    </dialog>
  )
}

export default function InvoicesPage({
  data = INVOICES_PREVIEW_DATA,
  loading = false,
  error = '',
  onDownloadInvoice,
  onDownloadStatement,
}) {
  const [theme, setTheme] = useState(initialTheme)
  const [tab, setTab] = useState('open')
  const [query, setQuery] = useState('')
  const [site, setSite] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // The page remains usable without storage.
    }
  }, [theme])

  const ready = !loading && !error && Boolean(data)
  const invoices = ready ? data.invoices : []
  const issued = invoices.filter(invoice => invoice.status === 'issued')
  const openInvoices = invoices.filter(isOpen)
  const overdueInvoices = invoices.filter(
    invoice => invoice.is_overdue && invoice.status === 'issued'
  )

  const sites = Array.from(
    new Map(
      invoices.map(invoice => [String(invoice.job.site.id), invoice.job.site])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name))



  const counts = {
    open: openInvoices.length,
    overdue: overdueInvoices.length,
    paid: invoices.filter(item => item.payment_status === 'paid').length,
    payments: invoices.reduce((sum, item) => sum + item.payments.length, 0),
    all: invoices.length,
  }

  const outstanding = sumByCurrency(openInvoices, item => item.balance_due)
  const overdueTotals = sumByCurrency(overdueInvoices, item => item.balance_due)
  const paidTotals = sumByCurrency(issued, item => item.amount_paid).filter(
    item => item.minor > 0
  )

  const filtered = invoices.filter(invoice => {
    const searchText = [
      invoice.number,
      invoice.description,
      invoice.job.id,
      invoice.job.site.name,
      invoice.job.site.region.name,
      ...invoice.lines.map(item => `${item.description} ${item.reference || ''}`),
    ]
      .join(' ')
      .toLowerCase()

    return (
      searchText.includes(query.trim().toLowerCase()) &&
      (site === 'all' || String(invoice.job.site.id) === site)
    )
  })

  const visible = filtered
    .filter(invoice => {
      if (tab === 'all') return true
      if (tab === 'open') return isOpen(invoice)
      if (tab === 'overdue') return invoice.is_overdue
      if (tab === 'paid') return invoice.payment_status === 'paid'

      return false
    })
    .sort((a, b) =>
      tab === 'open' || tab === 'overdue'
        ? a.due_date.localeCompare(b.due_date)
        : b.issue_date.localeCompare(a.issue_date)
    )

  const ledgerRows = filtered
    .flatMap(invoice =>
      invoice.payments.map(item => ({ ...item, invoice }))
    )
    .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))

  function clearFilters() {
    setQuery('')
    setSite('all')
    setTab('open')
  }

  const selectedInvoice = selected
    ? invoices.find(item => item.id === selected.id)
    : null

  return (
    <div className="sv-page" data-theme={theme}>
      <a className="sv-skip" href="#invoices-content">
        Skip to invoices
      </a>

      <CustomerNavbar
        companyName="Demo Customer Company"
        customerName="Customer account"
        unreadCount={2}
        theme={theme}
      />

      <div className="sv-main">
        <header className="sv-topbar">
          <span>
            Customer portal / <strong>Invoices &amp; payments</strong>
          </span>

          <button
            className="sv-theme-button"
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={() =>
              setTheme(value => (value === 'light' ? 'dark' : 'light'))
            }
          >
            {theme === 'light' ? (
              <MoonIcon size={21} aria-hidden="true" />
            ) : (
              <SunIcon size={21} aria-hidden="true" />
            )}
          </button>
        </header>

        <main
          className="sv-content"
          id="invoices-content"
          tabIndex={-1}
          aria-busy={loading}
        >
          <div className="sv-heading">
            <div>
              <h1>Know what you owe.</h1>
              <p>
                See every invoice, what has been paid, what is still
                remaining and how to pay it.
              </p>
            </div>
          </div>

          {loading && (
            <div className="sv-message" role="status">
              Loading your invoices…
            </div>
          )}

          {error && (
            <div className="sv-message" role="alert">
              Could not load your invoices. Please refresh and try again.
            </div>
          )}

          {!loading && !error && !data && (
            <div className="sv-message">
              <ReceiptIcon size={32} aria-hidden="true" />
              <h2>Invoice data is not connected yet</h2>
              <p>
                Your invoices and payments will appear here once the
                customer billing API is connected.
              </p>
            </div>
          )}

          {ready && (
            <>
              {data.is_demo && (
                <p className="sv-demo-notice">
                  Preview mode · Fictional invoices. No live backend
                  connection.
                </p>
              )}

              <section className="sv-summary" aria-label="Invoice summary">
                <div className="sv-summary-item">
                  <span className="sv-summary-icon">
                    <WalletIcon size={23} aria-hidden="true" />
                  </span>
                  <div>
                    <span>Outstanding balance</span>
                    <SummaryValues list={outstanding} fallback="Nothing due" />
                  </div>
                </div>

                <div
                  className={`sv-summary-item${overdueTotals.length ? ' sv-summary-item--alert' : ''}`}
                >
                  <span className="sv-summary-icon">
                    <WarningCircleIcon size={23} aria-hidden="true" />
                  </span>
                  <div>
                    <span>Overdue</span>
                    <SummaryValues list={overdueTotals} fallback="None" />
                  </div>
                </div>

                <div className="sv-summary-item">
                  <span className="sv-summary-icon">
                    <CheckCircleIcon size={23} aria-hidden="true" />
                  </span>
                  <div>
                    <span>Paid to date</span>
                    <SummaryValues list={paidTotals} fallback="Nothing yet" />
                  </div>
                </div>

                <div className="sv-summary-item">
                  <span className="sv-summary-icon">
                    <ReceiptIcon size={23} aria-hidden="true" />
                  </span>
                  <div>
                    <span>Open invoices</span>
                    <div className="iv-values">
                      <strong>{counts.open}</strong>
                    </div>
                  </div>
                </div>
              </section>

              {counts.overdue > 0 && tab !== 'overdue' && (
                <div className="sv-banner" role="status">
                  <WarningCircleIcon size={22} aria-hidden="true" />
                  <p>
                    {counts.overdue === 1
                      ? '1 invoice is overdue'
                      : `${counts.overdue} invoices are overdue`}
                    : {moneyList(overdueTotals)} remaining.
                  </p>
                  <button type="button" onClick={() => setTab('overdue')}>
                    Show them
                  </button>
                </div>
              )}

              <div className="sv-tabs" role="group" aria-label="Invoice filter">
                {TABS.map(item => (
                  <button
                    key={item.value}
                    type="button"
                    className="sv-tab"
                    aria-pressed={tab === item.value}
                    onClick={() => setTab(item.value)}
                  >
                    {item.label}
                    <span>{counts[item.value]}</span>
                  </button>
                ))}
              </div>

              <div className="sv-toolbar">
                <label className="sv-search">
                  <span className="sv-sr">Search invoices</span>
                  <MagnifyingGlassIcon size={20} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search invoice number, job or description"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                </label>

                <div className="sv-filters">
                  <label>
                    <span>Site</span>
                    <select
                      value={site}
                      onChange={event => setSite(event.target.value)}
                    >
                      <option value="all">All sites</option>
                      {sites.map(item => (
                        <option key={item.id} value={String(item.id)}>
                          {item.name} · {item.region.name}
                        </option>
                      ))}
                    </select>
                  </label>

                </div>
              </div>

              {!invoices.length ? (
                <div className="sv-message iv-gap">
                  <ReceiptIcon size={32} aria-hidden="true" />
                  <h2>No invoices yet</h2>
                  <p>
                    Invoices appear here once our team issues them after
                    your service is completed.
                  </p>
                  <a href="mailto:info@alethijahath.com">Contact support</a>
                </div>
              ) : tab === 'payments' ? (
                <Ledger
                  rows={ledgerRows}
                  onOpen={(invoice, pay) => setSelected({ id: invoice.id, pay })}
                  onDownloadStatement={onDownloadStatement}
                />
              ) : (
                <>
                  <p className="sv-results" role="status" aria-live="polite">
                    Showing {visible.length} of {invoices.length} invoices
                  </p>

                  {!visible.length ? (
                    <div className="sv-message">
                      <h2>
                        {tab === 'open' && !query && site === 'all'
                          ? 'No open invoices'
                          : 'No matching invoices'}
                      </h2>
                      <p>
                        {tab === 'open' && !query && site === 'all'
                          ? 'You are all paid up. Thank you.'
                          : 'Try a different search or change your filters.'}
                      </p>
                      <button type="button" onClick={clearFilters}>
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="sv-list">
                      {visible.map(invoice => (
                        <InvoiceCard
                          key={invoice.id}
                          invoice={invoice}
                          onOpen={(item, pay) =>
                            setSelected({ id: item.id, pay })
                          }
                          onDownloadInvoice={onDownloadInvoice}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <p className="iv-footnote">
                Amounts for this Riyadh demo account are shown in SAR.
                Payments appear after our team confirms and records them.
                Preview bank details are fictional.
              </p>
            </>
          )}

          <footer className="sv-footer">
            <span>Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Contact support</a>
          </footer>
        </main>

        {selectedInvoice && (
          <InvoiceDialog
            key={`${selectedInvoice.id}-${selected.pay}`}
            invoice={selectedInvoice}
            focusPay={selected.pay}
            onDownloadInvoice={onDownloadInvoice}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  )
}