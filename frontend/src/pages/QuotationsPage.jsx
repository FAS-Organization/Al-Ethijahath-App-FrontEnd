import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowCounterClockwiseIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MoonIcon,
  SunIcon,
  XIcon,
} from '@phosphor-icons/react'
import CustomerNavbar from '../components/CustomerNavbar'
import DateRangeFilter from '../components/DateRangeFilter'
import { inDateRange } from '../utils/dateRange'
import { createDemoQuotations } from '../data/quotationsPreviewData'
import { INSPECTIONS_PREVIEW_DATA } from '../data/inspectionsPreviewData'
import './QuotationsPage.css'

const THEME_KEY = 'ethijahath-dashboard-theme'

const STATUS_LABELS = {
  sent: 'Awaiting approval',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  superseded: 'Superseded',
}

const FILTERS = [
  { value: 'all', label: 'All current' },
  { value: 'sent', label: 'Awaiting approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
]

function formatMoney(value, currency = 'SAR') {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function formatDate(value, includeTime = false) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      : {}),
  }).format(new Date(value))
}

function getStatus(quotation, now) {
  if (
    quotation.status === 'sent' &&
    quotation.expires_at &&
    new Date(quotation.expires_at).getTime() <= now
  ) {
    return 'expired'
  }

  return quotation.status
}

function getLatestQuotations(quotations) {
  const latest = new Map()

  quotations
    .filter(quotation => quotation.status !== 'draft')
    .forEach(quotation => {
      const key = quotation.job_equipment.id
      const previous = latest.get(key)

      if (!previous || quotation.version > previous.version) {
        latest.set(key, quotation)
      }
    })

  return [...latest.values()].sort(
    (first, second) =>
      new Date(second.sent_at).getTime() -
      new Date(first.sent_at).getTime(),
  )
}

/*
 * Fictional frontend preview records.
 *
 * Quotation fields follow the current model.
 * Nested equipment/site/report labels are a frontend display structure,
 * not a claim about an existing API response.
 *
 * Dates are relative to when the preview opens, so the demo always has
 * an actionable quotation as well as historical examples.
 */


function StatusBadge({ status }) {
  return (
    <span className={`qt-status qt-status--${status}`}>
      {status === 'approved' ? (
        <CheckCircleIcon size={15} aria-hidden="true" />
      ) : status === 'sent' || status === 'expired' ? (
        <ClockIcon size={15} aria-hidden="true" />
      ) : null}

      {STATUS_LABELS[status] || status}
    </span>
  )
}

function DetailField({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}


function QuotationDialog({
  quotation,
  versions,
  now,
  onClose,
  onSelectVersion,
  onDecision,
  onOpenService,
  onOpenInspection,
  onEmailQuotation,
}) {
  const dialogRef = useRef(null)
  const emailBusyRef = useRef(false)
  const [preparingEmail, setPreparingEmail] = useState(false)

  function closeDialog() {
    if (emailBusyRef.current) return
    onClose()
  }
  const [mode, setMode] = useState('review')
  const [acceptanceMethod, setAcceptanceMethod] = useState('')
  const [purchaseOrder, setPurchaseOrder] = useState(null)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const status = getStatus(quotation, now)
  const latestVersion = versions[0]
  const isLatest = latestVersion.id === quotation.id

  const canDecide =
    isLatest &&
    status === 'sent' &&
    Boolean(quotation.expires_at)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus()
      }
    }
  }, [])
    const confirmationHeadingRef = useRef(null)

  useEffect(() => {
    if (mode === 'review') return

    const heading = confirmationHeadingRef.current
    if (!heading) return

    heading.focus({ preventScroll: true })
    heading.scrollIntoView({
      behavior: 'instant',
      block: 'start',
    })
  }, [mode])

  function chooseVersion(id) {
    setMode('review')
    setReason('')
    setFeedback('')
    setError('')
    onSelectVersion(id)
  }

  function beginDecision(nextMode) {
    setMode(nextMode)
    setAcceptanceMethod('')
    setPurchaseOrder(null)
    setFeedback('')
    setError('')
  }

  async function submitDecision(event) {
    event.preventDefault()

    if (emailBusyRef.current) return

    setError('')
    setFeedback('')

    if (!canDecide || getStatus(quotation, Date.now()) !== 'sent') {
      setError('This quotation is no longer available for a decision.')
      return
    }

    if (mode === 'accept' && !acceptanceMethod) {
      setError('Choose how you want to confirm this quotation.')
      return
    }

    if (mode === 'accept' && acceptanceMethod === 'email') {
      // Backend integration:
      // onEmailQuotation receives the exact quotation ID and version.
      // Django must resolve the registered recipient, validate access
      // and validity, attach this version's PDF, and queue the email.
      // Resolve with { status: 'queued' } only after the request is saved.
      // Reject on failure. Requesting an email never approves a quotation.

      if (!onEmailQuotation) {
        setFeedback(
          'Preview only — no email was sent. ' +
          'In the connected application, you will receive this quotation ' +
          'and its PDF at your registered company email address. ' +
          'Reply with your acceptance and add your purchasing contact ' +
          'or authorized approver in CC. Sales will verify your reply. ' +
          'This quotation remains awaiting approval.',
        )

        setMode('review')
        return
      }

      emailBusyRef.current = true
      setPreparingEmail(true)

      try {
        const result = await onEmailQuotation({
          quotationId: quotation.id,
          version: quotation.version,
        })

        if (result?.status !== 'queued') {
          throw new Error(
            'The email request could not be confirmed. Please try again.',
          )
        }

        setFeedback(
          'Your quotation email has been queued for delivery to your ' +
          'registered company email address, with the quotation PDF attached. ' +
          'Once it arrives, reply with your acceptance and add your ' +
          'purchasing contact or authorized approver in CC. ' +
          'Sales will verify your reply before marking this quotation Approved.',
        )

        setMode('review')
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Could not request the quotation email. Please try again.',
        )
      } finally {
        emailBusyRef.current = false
        setPreparingEmail(false)
      }

      return
    }

    if (mode === 'accept') {
      if (!purchaseOrder) {
        setError('Select a purchase order before confirming acceptance.')
        return
      }

      const allowedExtension = /\.(pdf|png|jpe?g|webp)$/i

      if (!allowedExtension.test(purchaseOrder.name) || purchaseOrder.size === 0) {
        setError('Select a non-empty PDF, JPG, PNG or WebP file.')
        return
      }
    }

    const result = onDecision(
      quotation.id,
      mode === 'accept' ? 'approved' : 'rejected',
      reason.trim(),
      mode === 'accept' ? purchaseOrder : null,
    )

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMode('review')
    setReason('')
    setPurchaseOrder(null)
    setFeedback(result.message)
  }

  function openRelated(callback, value) {
    onClose()
    callback(value)
  }

  return (
    <dialog
      ref={dialogRef}
      className="qt-dialog"
      aria-labelledby="qt-dialog-title"
      onCancel={event => {
        event.preventDefault()
        closeDialog()
      }}
    >
      <div className="qt-dialog-header">
        <div>
          <h2 id="qt-dialog-title">{quotation.number}</h2>
          <p>
            Version {quotation.version} · Service{' '}
            {quotation.job_equipment.reference}
          </p>
        </div>

        <button
          type="button"
          className="qt-icon-button"
          onClick={closeDialog}
          disabled={preparingEmail}
          aria-label="Close quotation"
          autoFocus
        >
          <XIcon size={22} aria-hidden="true" />
        </button>
      </div>

      <div
        className="qt-dialog-body"
        inert={preparingEmail}
        aria-busy={preparingEmail}
      >
        <div className="qt-dialog-status">
          <StatusBadge status={status} />

          <span>
            {isLatest ? 'Latest issued version' : 'Previous version'}
          </span>
        </div>

        {!isLatest ? (
          <div className="qt-notice">
            <p>
              This is a previous quotation version. It is available for
              reference and cannot be accepted or rejected.
            </p>

            <button
              type="button"
              className="qt-text-button"
              onClick={() => chooseVersion(latestVersion.id)}
            >
              View version {latestVersion.version}
              <ArrowUpRightIcon size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <section className="qt-detail-section">
          <h3>Equipment & service</h3>

          <dl className="qt-detail-grid">
            <DetailField label="Equipment">
              {quotation.job_equipment.equipment_name}
            </DetailField>

            <DetailField label="Model">
              {quotation.job_equipment.model_name}
            </DetailField>

            <DetailField label="Asset number">
              {quotation.job_equipment.asset_number}
            </DetailField>

            <DetailField label="Service reference">
              {quotation.job_equipment.reference}
            </DetailField>

            <DetailField label="Service site">
              {quotation.job_equipment.site_name}
            </DetailField>

            <DetailField label="Customer">
              {quotation.company_name}
            </DetailField>
          </dl>

          <button
            type="button"
            className="qt-text-button"
            disabled={!onOpenService}
            onClick={() =>
              openRelated(onOpenService, quotation.job_equipment.id)
            }
          >
            Open service job
            <ArrowUpRightIcon size={16} aria-hidden="true" />
          </button>

          {!onOpenService ? (
            <p className="qt-helper">
              Service navigation will be enabled when that page is connected.
            </p>
          ) : null}
        </section>

        <section className="qt-detail-section">
          <h3>Proposed work</h3>
          <p className="qt-preserve-lines">{quotation.customer_summary}</p>

          <div className="qt-estimate">
            <ClockIcon size={21} aria-hidden="true" />

            <div>
              <strong>Estimated completion</strong>
              <p>{quotation.estimated_completion_text}</p>
            </div>
          </div>
        </section>

        <div className="qt-total">
          <div>
            <span>Final quoted total</span>
            <p>For the work described in this version</p>
          </div>

          <strong>
            {formatMoney(quotation.total, quotation.currency)}
          </strong>
        </div>

        <section className="qt-detail-section">
          <h3>Validity & decision</h3>

          <dl className="qt-detail-grid">
            <DetailField label="Sent">
              {formatDate(quotation.sent_at, true)}
            </DetailField>

            <DetailField label="Valid until">
              {formatDate(quotation.expires_at, true)}
            </DetailField>

            {quotation.decided_at ? (
              <DetailField label="Decision recorded">
                {formatDate(quotation.decided_at, true)}
              </DetailField>
            ) : null}
          </dl>

          <p className="qt-helper">All times are shown in Saudi time.</p>

          {status === 'approved' ? (
            <div className="qt-notice qt-notice--success">
              This quotation version has been approved and is locked.
              Approval does not mean the repair has started. Follow the
              linked service job for work updates.
            </div>
          ) : null}
          {status === 'approved' && quotation.purchase_order && (
            <p>
              <strong>Purchase order:</strong> {quotation.purchase_order.name}
              <br />
              <small>Selected in this preview. Refreshing clears the file.</small>
            </p>
          )}
          {status === 'rejected' ? (
            <div className="qt-notice">
              <strong>Rejection reason</strong>
              <p className="qt-preserve-lines">
                {quotation.rejection_reason || 'No reason provided.'}
              </p>
            </div>
          ) : null}

          {status === 'expired' ? (
            <div className="qt-notice">
              This quotation can no longer be accepted. Contact our team
              for a revised quotation. Expiry does not automatically
              cancel the service job.
            </div>
          ) : null}
        </section>

        <section className="qt-detail-section">
          <h3>Terms</h3>

          <p className="qt-preserve-lines">
            {quotation.terms || 'No additional terms recorded.'}
          </p>
        </section>

        <section className="qt-detail-section">
          <h3>Related documents</h3>

          <div className="qt-document">
            <FileTextIcon size={25} aria-hidden="true" />

            <div>
              <strong>Quotation PDF · Version {quotation.version}</strong>
              <p>
                {quotation.pdf_url
                  ? 'Published PDF for this exact quotation version.'
                  : 'No sample PDF is attached to this preview record.'}
              </p>
            </div>

            {quotation.pdf_url ? (
              <a
                className="qt-button qt-button--secondary"
                href={quotation.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DownloadSimpleIcon size={17} aria-hidden="true" />
                Open PDF
              </a>
            ) : (
              <button
                type="button"
                className="qt-button qt-button--secondary"
                disabled
                title="A published quotation PDF is required."
              >
                <DownloadSimpleIcon size={17} aria-hidden="true" />
                PDF unavailable
              </button>
            )}
          </div>

          <div className="qt-document">
            <FileTextIcon size={25} aria-hidden="true" />

            <div>
              <strong>Source inspection report</strong>
              <p>{quotation.inspection_reference}</p>
            </div>

            <button
              type="button"
              className="qt-button qt-button--secondary"
              disabled={!onOpenInspection}
              onClick={() => openRelated(onOpenInspection, quotation)}
            >
              View report
            </button>
          </div>

          <p className="qt-helper">
            Only customer-published documents should be linked when the
            backend is connected.
          </p>
        </section>

        <section className="qt-detail-section">
          <h3>Quotation versions</h3>

          <p className="qt-helper">
            Previous issued versions remain available for reference.
          </p>

          <ol className="qt-version-list">
            {versions.map(version => (
              <li key={version.id}>
                <div>
                  <strong>
                    Version {version.version}
                    {version.id === latestVersion.id ? ' · Latest' : ''}
                  </strong>

                  <span>
                    {formatDate(version.sent_at)} ·{' '}
                    {formatMoney(version.total, version.currency)}
                  </span>
                </div>

                <StatusBadge status={getStatus(version, now)} />

                <button
                  type="button"
                  className="qt-text-button"
                  disabled={version.id === quotation.id}
                  onClick={() => chooseVersion(version.id)}
                >
                  {version.id === quotation.id ? 'Viewing' : 'View'}
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className="qt-feedback" role="status" aria-live="polite">
          {feedback ? (
            <p className="qt-notice qt-notice--success">{feedback}</p>
          ) : null}
        </div>

        {error ? (
          <p className="qt-notice qt-notice--error" role="alert">
            {error}
          </p>
        ) : null}

        {canDecide && mode !== 'review' ? (
          <form className="qt-confirmation" onSubmit={submitDecision}>
            <h3 ref={confirmationHeadingRef} tabIndex={-1}>
              {mode === 'accept'
                ? 'Accept this quotation?'
                : 'Reject this quotation?'}
            </h3>

            <p>
              {mode === 'accept'
                ? `Review version ${quotation.version} for ${formatMoney(
                    quotation.total,
                    quotation.currency,
                  )}. Confirm with a purchase order, or request an email copy and reply with your acceptance.`
                : `You are rejecting version ${quotation.version}. You may add a reason for the team.`}
            </p>
            {mode === 'accept' && (
              <fieldset className="qt-accept-method">
                <legend>How would you like to confirm?</legend>

                <label>
                  <input
                    type="radio"
                    name="quotation-acceptance-method"
                    value="po"
                    checked={acceptanceMethod === 'po'}
                    onChange={() => {
                      setAcceptanceMethod('po')
                      setError('')
                    }}
                  />
                  Upload purchase order
                </label>

                <label>
                  <input
                    type="radio"
                    name="quotation-acceptance-method"
                    value="email"
                    checked={acceptanceMethod === 'email'}
                    onChange={() => {
                      setAcceptanceMethod('email')
                      setPurchaseOrder(null)
                      setError('')
                    }}
                  />
                  Confirm by email
                </label>

                {acceptanceMethod === 'po' && (
                  <label className="qt-po-upload">
                    <strong>Purchase order file</strong>
                    <span>Choose a PDF, JPG, PNG or WebP image.</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      required
                      onChange={event => {
                        setPurchaseOrder(event.target.files?.[0] ?? null)
                        setError('')
                      }}
                    />
                  </label>
                )}

                {acceptanceMethod === 'email' && (
                  <div className="qt-notice">
                    <strong>Receive the quotation in your inbox</strong>

                    <p>
                      We will email this quotation version and its PDF
                      to your registered company email address.
                    </p>

                    <p className="qt-helper">
                      Open the email and reply with your acceptance.
                      Add your purchasing contact or authorized approver
                      in CC. Include your name and role, and attach your
                      purchase order if one has been issued. If your company
                      does not issue a purchase order, state that in your reply.
                    </p>

                    <p className="qt-helper">
                      The quotation stays awaiting approval until Sales
                      verifies your reply.
                    </p>

                    {!onEmailQuotation && (
                      <p className="qt-helper">
                        Preview only — this button simulates the request.
                        No email will be sent.
                      </p>
                    )}
                  </div>
                )}
              </fieldset>
            )}
            {mode === 'reject' ? (
              <label className="qt-reason">
                <span>Reason for rejection (optional)</span>

                <textarea
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  rows={3}
                  placeholder="Tell us why you are rejecting this quotation."
                />
              </label>
            ) : null}

            <p className="qt-helper">
              {mode === 'accept' && acceptanceMethod === 'email'
                ? 'Requesting an email does not record your acceptance.'
                : 'Preview only. This decision changes the demo on this page.'}
            </p>

            <div className="qt-button-row">
              <button
                type="submit"
                className="qt-button"
                disabled={preparingEmail}
                aria-busy={preparingEmail}
              >
                {preparingEmail
                  ? 'Requesting quotation email…'
                  : mode === 'reject'
                    ? 'Confirm rejection'
                    : acceptanceMethod === 'email'
                      ? 'Email me the quotation'
                      : 'Confirm acceptance'}
              </button>

              <button
                type="button"
                className="qt-button qt-button--secondary"
                onClick={() => {
                  setMode('review')
                  setError('')
                }}
              >
                Go back
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="qt-dialog-footer">
        <span role="status" aria-live="polite">
          {preparingEmail
            ? 'Requesting quotation email…'
            : 'Demo quotation · No payment is collected here'}
        </span>

        <div className="qt-button-row">
          {canDecide && mode === 'review' ? (
            <>
              <button
                type="button"
                className="qt-button qt-button--secondary"
                onClick={() => beginDecision('reject')}
              >
                Reject quotation
              </button>

              <button
                type="button"
                className="qt-button"
                onClick={() => beginDecision('accept')}
              >
                <CheckCircleIcon size={18} aria-hidden="true" />
                Accept quotation
              </button>
            </>
          ) : (
            <button
              type="button"
              className="qt-button qt-button--secondary"
              onClick={closeDialog}
          disabled={preparingEmail}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}




export default function QuotationsPage({
  onOpenService,
  onOpenInspection,
  onEmailQuotation,
}) {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState(createDemoQuotations)
  const [now, setNow] = useState(() => Date.now())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // The page still works if browser storage is unavailable.
    }
  }, [theme])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const currentQuotations = getLatestQuotations(quotations)

  const sites = [
    ...new Set(
      currentQuotations.map(quotation => quotation.job_equipment.site_name),
    ),
  ].sort()

  const counts = currentQuotations.reduce(
    (result, quotation) => {
      const status = getStatus(quotation, now)
      result[status] = (result[status] || 0) + 1
      return result
    },
    {},
  )

  const awaitingApproval = currentQuotations.filter(
    quotation => getStatus(quotation, now) === 'sent',
  )

  const awaitingTotal = awaitingApproval.reduce(
    (total, quotation) => total + Number(quotation.total),
    0,
  )

  const normalizedSearch = search.trim().toLowerCase()

  const visibleQuotations = currentQuotations.filter(quotation => {
    const equipment = quotation.job_equipment

    const searchableText = [
      quotation.number,
      equipment.reference,
      equipment.equipment_name,
      equipment.model_name,
      equipment.asset_number,
      equipment.site_name,
    ]
      .join(' ')
      .toLowerCase()

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (statusFilter === 'all' ||
        getStatus(quotation, now) === statusFilter) &&
      (siteFilter === 'all' || equipment.site_name === siteFilter) &&
      inDateRange(quotation.sent_at, dateFrom, dateTo)
    )
  })

  const selectedQuotation =
    quotations.find(quotation => quotation.id === selectedId) || null

  const selectedVersions = selectedQuotation
    ? quotations
        .filter(
          quotation =>
            quotation.status !== 'draft' &&
            quotation.job_equipment.id ===
              selectedQuotation.job_equipment.id,
        )
        .sort((first, second) => second.version - first.version)
    : []

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setSiteFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  function resetPreview() {
    setSelectedId(null)
    setQuotations(createDemoQuotations())
    setNow(Date.now())
    clearFilters()
  }

  function decideQuotation(id, decision, rejectionReason, purchaseOrder = null) {
    const decisionTime = Date.now()
    const quotation = quotations.find(item => item.id === id)

    const latest = quotation
      ? getLatestQuotations(quotations).find(
          item => item.job_equipment.id === quotation.job_equipment.id,
        )
      : null

    setNow(decisionTime)

    if (
      !quotation ||
      latest?.id !== id ||
      getStatus(quotation, decisionTime) !== 'sent' ||
      !quotation.expires_at
    ) {
      return {
        ok: false,
        message:
          'This version is no longer available for a decision. ' +
          'Review its current status or contact our team.',
      }
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return {
        ok: false,
        message: 'The decision could not be recorded. Please try again.',
      }
    }
    if (decision === 'approved' && !purchaseOrder) {
      return {
        ok: false,
        message: 'A purchase order is required for this acceptance method.',
      }
    }
    setQuotations(items =>
      items.map(item =>
        item.id === id
          ? {
              ...item,
              status: decision,
              purchase_order: purchaseOrder,
              decided_at: new Date(decisionTime).toISOString(),
              rejection_reason:
                decision === 'rejected' ? rejectionReason : '',
            }
          : item,
      ),
    )

    return {
      ok: true,
      message:
        decision === 'approved'
          ? 'Demo acceptance recorded. This quotation version is now locked.'
          : 'Demo rejection recorded. The quotation status has been updated.',
    }
  }

  return (
    <div className="qt-page" data-theme={theme}>


      <CustomerNavbar
        companyName="Demo Customer Company"
        customerName="Customer account"
        unreadCount={2}
        theme={theme}
      />
      <main className="qt-main" id="qt-main" tabIndex={-1}>
        <header className="qt-topbar">
          <div className="qt-breadcrumb">
            <span>Customer portal</span>
            <span aria-hidden="true">/</span>
            <strong>Inspections &amp; quotations</strong>
          </div>

          <div className="qt-topbar-actions">
            <span className="qt-region">
              <MapPinIcon size={17} aria-hidden="true" />
              Riyadh
            </span>

            <button
              type="button"
              className="qt-icon-button"
              onClick={() =>
                setTheme(current => (current === 'light' ? 'dark' : 'light'))
              }
              aria-label={`Switch to ${
                theme === 'light' ? 'dark' : 'light'
              } theme`}
            >
              {theme === 'light' ? (
                <MoonIcon size={20} aria-hidden="true" />
              ) : (
                <SunIcon size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        <div className="qt-content">
          <div className="qt-page-heading">
            <div>
              <h1>Inspections &amp; quotations</h1>
              <p>
                Review your equipment inspections and decide on quotations for the proposed work.
              </p>
            </div>

            <a
              className="qt-button qt-button--secondary"
              href="mailto:info@alethijahath.com"
            >
              Contact support
              <ArrowUpRightIcon size={17} aria-hidden="true" />
            </a>
          </div>

          <div className="qt-preview">
            <p>
              <strong>Frontend preview.</strong> Fictional quotations,
              relative sample dates and local decisions. Refreshing resets
              your changes.
            </p>

            <button
              type="button"
              className="qt-text-button"
              onClick={resetPreview}
            >
              <ArrowCounterClockwiseIcon size={17} aria-hidden="true" />
              Reset preview
            </button>
          </div>

          <section className="qt-attention" aria-labelledby="qt-attention-title">
            <div className="qt-attention-icon">
              {awaitingApproval.length ? (
                <FileTextIcon size={29} aria-hidden="true" />
              ) : (
                <CheckCircleIcon size={29} aria-hidden="true" />
              )}
            </div>

            <div className="qt-attention-copy">
              <h2 id="qt-attention-title">
                {awaitingApproval.length
                  ? `${awaitingApproval.length} quotation${
                      awaitingApproval.length === 1 ? '' : 's'
                    } awaiting your approval`
                  : 'No quotations awaiting approval'}
              </h2>

              <p>
                {awaitingApproval.length
                  ? 'Review the scope and terms before the quotation expires.'
                  : 'Your previous quotations and decisions remain available below.'}
              </p>
            </div>

            {awaitingApproval.length ? (
              <div className="qt-attention-total">
                <span>Awaiting approval · quoted total</span>
                <strong>{formatMoney(awaitingTotal)}</strong>
                <small>This is not an outstanding invoice balance.</small>
              </div>
            ) : null}
          </section>

          <section
            className="qt-panel qt-inspections"
            aria-labelledby="qt-inspections-title"
          >
            <div className="qt-panel-heading">
              <div>
                <h2 id="qt-inspections-title">Inspection reports</h2>
                <p>Review the technician’s findings and any related quotation.</p>
              </div>
            </div>

            <div className="qt-inspection-list">
              {INSPECTIONS_PREVIEW_DATA.map(report => {
                const relatedQuote = currentQuotations.find(
                  quote => quote.inspection_report_id === report.id,
                )

                const statusLabel = {
                  pending_approval: 'Awaiting signature',
                  approved: 'Approved',
                  superseded: 'Previous version',
                }[report.status]

                return (
                  <details
                    className="qt-inspection"
                    id={report.id}
                    key={report.id}
                  >
                    <summary>
                      <FileTextIcon size={22} aria-hidden="true" />

                      <span className="qt-inspection-title">
                        <strong>{report.equipment}</strong>
                        <small>
                          {report.number} · Version {report.version} · Service{' '}
                          {report.serviceReference}
                        </small>
                      </span>

                      <span
                        className={`qt-status qt-status--${
                          report.status === 'pending_approval'
                            ? 'sent'
                            : report.status
                        }`}
                      >
                        {statusLabel}
                      </span>

                      <span className="qt-inspection-toggle" aria-hidden="true" />
                    </summary>

                    <div className="qt-inspection-body">
                      <dl className="qt-detail-grid">
                        <DetailField label="Service site">
                          {report.site}
                        </DetailField>

                        <DetailField label="Technician remarks">
                          {report.remarks}
                        </DetailField>
                      </dl>

                      <h3>Inspection findings</h3>

                      {report.findings.length > 0 ? (
                        <ul>
                          {report.findings.map(finding => (
                            <li key={finding.component}>
                              <strong>{finding.component}</strong>
                              {' · '}{finding.condition}
                              {' · Proposed action: '}{finding.proposed_action}
                              <p>{finding.description}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="qt-helper">
                          No individual findings recorded in this preview.
                        </p>
                      )}

                      {report.status === 'pending_approval' && (
                        <p className="qt-notice">
                          This report is awaiting the customer’s signature.
                          Signature capture is pending backend integration.
                        </p>
                      )}

                      {relatedQuote && (
                        <button
                          type="button"
                          className="qt-text-button"
                          onClick={() => setSelectedId(relatedQuote.id)}
                        >
                          View quotation {relatedQuote.number}
                          <ArrowUpRightIcon size={16} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </details>
                )
              })}
            </div>
          </section>

          <section className="qt-panel" aria-labelledby="qt-list-title">
            <div className="qt-panel-heading">
              <div>
                <h2 id="qt-list-title">Your quotations</h2>
                <p>
                  Latest issued versions. Open a quotation to see its history.
                </p>
              </div>

              <span className="qt-record-count">
                {currentQuotations.length} records
              </span>
            </div>

            <details className="qt-filter-disclosure">
              <summary>Filter quotations</summary>

              <div className="qt-filters" aria-label="Filter quotations by status">
                {FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`qt-filter${
                      statusFilter === filter.value ? ' is-active' : ''
                    }`}
                    aria-pressed={statusFilter === filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}

                    <span>
                      {filter.value === 'all'
                        ? currentQuotations.length
                        : counts[filter.value] || 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="qt-toolbar">
                <label className="qt-search">
                  <span className="qt-sr-only">
                    Search quotation, equipment, asset, service or site
                  </span>

                  <MagnifyingGlassIcon size={20} aria-hidden="true" />

                  <input
                    type="search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search quotation, equipment or service"
                  />
                </label>

                <label className="qt-site-filter">
                  <span>Site</span>

                  <select
                    value={siteFilter}
                    onChange={event => setSiteFilter(event.target.value)}
                  >
                    <option value="all">All sites</option>

                    {sites.map(site => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="drf-wrap">
                <DateRangeFilter
                  label="Sent date"
                  from={dateFrom}
                  to={dateTo}
                  onChange={(from, to) => {
                    setDateFrom(from)
                    setDateTo(to)
                  }}
                />
              </div>
            </details>

            <div className="qt-results-line" role="status" aria-live="polite">
              <span>
                Showing {visibleQuotations.length} of{' '}
                {currentQuotations.length} quotations
              </span>

              {search || statusFilter !== 'all' || siteFilter !== 'all' || dateFrom || dateTo ? (
                <button
                  type="button"
                  className="qt-text-button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            {!currentQuotations.length ? (
              <div className="qt-empty">
                <FileTextIcon size={36} aria-hidden="true" />
                <h3>No quotations issued yet</h3>
                <p>
                  Quotations will appear here when our team sends them for
                  your equipment services.
                </p>
              </div>
            ) : !visibleQuotations.length ? (
              <div className="qt-empty">
                <MagnifyingGlassIcon size={36} aria-hidden="true" />
                <h3>No matching quotations</h3>
                <p>Try another search or clear your selected filters.</p>

                <button
                  type="button"
                  className="qt-button qt-button--secondary"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div
                className="qt-table-scroll"
                role="region"
                aria-label="Quotation records"
                tabIndex={0}
              >
                <table className="qt-table">
                  <caption className="qt-sr-only">
                    Latest customer quotations with equipment, dates,
                    totals and approval status
                  </caption>

                  <thead>
                    <tr>
                      <th scope="col">Quotation</th>
                      <th scope="col">Equipment & site</th>
                      <th scope="col">Dates</th>
                      <th scope="col">Quoted total</th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="qt-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleQuotations.map(quotation => {
                      const status = getStatus(quotation, now)

                      return (
                        <tr key={quotation.id}>
                          <th scope="row">
                            <div className="qt-reference">
                              <span className="qt-file-icon">
                                <FileTextIcon size={23} aria-hidden="true" />
                              </span>

                              <div>
                                <strong>{quotation.number}</strong>
                                <small>
                                  Version {quotation.version} · Service{' '}
                                  {quotation.job_equipment.reference}
                                </small>
                              </div>
                            </div>
                          </th>

                          <td data-label="Equipment">
                            <strong>
                              {quotation.job_equipment.equipment_name}
                            </strong>

                            <small>
                              {quotation.job_equipment.asset_number} ·{' '}
                              {quotation.job_equipment.site_name}
                            </small>
                          </td>

                          <td data-label="Dates">
                            <span>{formatDate(quotation.sent_at)}</span>
                            <small>
                              Valid until {formatDate(quotation.expires_at)}
                            </small>
                          </td>

                          <td data-label="Total" className="qt-money-cell">
                            {formatMoney(quotation.total, quotation.currency)}
                          </td>

                          <td data-label="Status">
                            <StatusBadge status={status} />
                          </td>

                          <td className="qt-row-action">
                            <button
                              type="button"
                              className="qt-review-button"
                              onClick={() => setSelectedId(quotation.id)}
                              aria-label={`${
                                status === 'sent' ? 'Review' : 'View'
                              } ${quotation.number}, version ${
                                quotation.version
                              }`}
                            >
                              {status === 'sent' ? 'Review' : 'View'}
                              <ArrowUpRightIcon
                                size={17}
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="qt-panel-note">
              <ClockIcon size={17} aria-hidden="true" />
              <p>
                Check the exact expiry time inside each quotation.
                All dates and times use Saudi time.
              </p>
            </div>
          </section>

          <footer className="qt-footer">
            <span>Al Ethijahath</span>
            <span>Quotation approval and invoice payment are separate steps.</span>
          </footer>
        </div>

        {selectedQuotation ? (
          <QuotationDialog
            quotation={selectedQuotation}
            versions={selectedVersions}
            now={now}
            onClose={() => setSelectedId(null)}
            onSelectVersion={setSelectedId}
            onDecision={decideQuotation}
            onEmailQuotation={onEmailQuotation}
            onOpenService={
              onOpenService ||
              (() => {
                navigate(
                  `/services?service=${encodeURIComponent(
                    selectedQuotation.job_equipment.reference,
                  )}`,
                )
              })
            }
            onOpenInspection={
              onOpenInspection ||
              (INSPECTIONS_PREVIEW_DATA.some(
                report => report.id === selectedQuotation.inspection_report_id,
              )
                ? quote => {
                    requestAnimationFrame(() => {
                      const details = document.getElementById(
                        quote.inspection_report_id,
                      )

                      if (!details) return

                      details.open = true
                      details.querySelector('summary')?.focus({
                        preventScroll: true,
                      })
                      details.scrollIntoView({ block: 'center' })
                    })
                  }
                : undefined)
            }
          />
        ) : null}
      </main>
    </div>
  )
}