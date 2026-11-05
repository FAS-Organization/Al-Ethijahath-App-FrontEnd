import { useEffect, useRef, useState } from 'react'
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
import './QuotationsPage.css'

const THEME_KEY = 'ethijahath-dashboard-theme'
const DAY = 24 * 60 * 60 * 1000

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
function createDemoQuotations() {
  const base = Date.now()

  const at = days => new Date(base + days * DAY).toISOString()

  const makeQuotation = ({
    sentDays,
    decidedDays = null,
    ...quotation
  }) => ({
    currency: 'SAR',
    region_name: 'Riyadh',
    company_name: 'Demo Customer Company',
    rejection_reason: '',
    previous_version: null,
    sent_at: at(sentDays),
    expires_at: at(sentDays + 7),
    decided_at: decidedDays === null ? null : at(decidedDays),
    terms:
      'This sample quotation covers only the work described above. ' +
      'Additional work requires a separate quotation. ' +
      'The service team will confirm the repair schedule after approval.',
    ...quotation,
  })

  const toyotaService = {
    id: 101,
    reference: '1042A',
    equipment_name: 'Toyota forklift',
    model_name: '8FG25',
    asset_number: 'EQ-001',
    site_name: 'Riyadh main warehouse',
  }

  return [
    makeQuotation({
      id: 'quote-1042-v2',
      number: 'QUO-DEMO-1042A',
      version: 2,
      previous_version: 'quote-1042-v1',
      status: 'sent',
      sentDays: -2,
      total: '1200.00',
      job_equipment: toyotaService,
      inspection_reference: 'IR-DEMO-1042A · Version 1',
      customer_summary:
        'Replace the leaking hydraulic hose, check the associated ' +
        'connections and carry out a hydraulic leak and operating test.',
      estimated_completion_text:
        'Approximately one working day after parts are ready and ' +
        'the repair visit is confirmed.',
    }),
    makeQuotation({
      id: 'quote-1042-v1',
      number: 'QUO-DEMO-1042A',
      version: 1,
      status: 'superseded',
      sentDays: -4,
      total: '1350.00',
      job_equipment: toyotaService,
      inspection_reference: 'IR-DEMO-1042A · Version 1',
      customer_summary:
        'Replace the leaking hydraulic hose and associated fittings, ' +
        'then carry out a hydraulic operating test.',
      estimated_completion_text:
        'Approximately two working days after parts are ready.',
    }),
    makeQuotation({
      id: 'quote-1048-v1',
      number: 'QUO-DEMO-1048A',
      version: 1,
      status: 'approved',
      sentDays: -3,
      decidedDays: -2,
      total: '2400.00',
      job_equipment: {
        id: 108,
        reference: '1048A',
        equipment_name: 'Hyster forklift',
        model_name: 'H3.0FT',
        asset_number: 'EQ-004',
        site_name: 'Riyadh north warehouse',
      },
      inspection_reference: 'IR-DEMO-1048A · Version 1',
      customer_summary:
        'Replace worn brake components, adjust the braking system ' +
        'and complete a controlled braking test.',
      estimated_completion_text:
        'Approximately two working days after parts are ready.',
    }),
    makeQuotation({
      id: 'quote-1036-v1',
      number: 'QUO-DEMO-1036A',
      version: 1,
      status: 'approved',
      sentDays: -15,
      decidedDays: -14,
      total: '2000.00',
      job_equipment: {
        id: 96,
        reference: '1036A',
        equipment_name: 'Perkins generator',
        model_name: '1104A',
        asset_number: 'EQ-002',
        site_name: 'Riyadh main warehouse',
      },
      inspection_reference: 'IR-DEMO-1036A · Version 1',
      customer_summary:
        'Service the cooling system, replace the identified worn ' +
        'components and test generator operation under load.',
      estimated_completion_text:
        'Approximately two working days after the service visit begins.',
    }),
    makeQuotation({
      id: 'quote-1050-v1',
      number: 'QUO-DEMO-1050A',
      version: 1,
      status: 'rejected',
      sentDays: -5,
      decidedDays: -4,
      total: '850.00',
      rejection_reason:
        'We are postponing this repair until the next maintenance window.',
      job_equipment: {
        id: 110,
        reference: '1050A',
        equipment_name: 'Electric shutter',
        model_name: 'Industrial roller door',
        asset_number: 'EQ-003',
        site_name: 'Riyadh north warehouse',
      },
      inspection_reference: 'IR-DEMO-1050A · Version 1',
      customer_summary:
        'Replace the faulty safety sensor, adjust its alignment ' +
        'and test the shutter safety response.',
      estimated_completion_text:
        'Approximately half a working day after the visit is confirmed.',
    }),
    makeQuotation({
      id: 'quote-1052-v1',
      number: 'QUO-DEMO-1052A',
      version: 1,
      status: 'expired',
      sentDays: -12,
      total: '1650.00',
      job_equipment: {
        id: 112,
        reference: '1052A',
        equipment_name: 'Toyota forklift',
        model_name: '8FG25',
        asset_number: 'EQ-001',
        site_name: 'Riyadh main warehouse',
      },
      inspection_reference: 'IR-DEMO-1052A · Version 1',
      customer_summary:
        'Replace the damaged mast roller and check mast movement ' +
        'and alignment.',
      estimated_completion_text:
        'Approximately one working day after parts are ready.',
    }),
  ]
}

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
}) {
  const dialogRef = useRef(null)
  const [mode, setMode] = useState('review')
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

  function chooseVersion(id) {
    setMode('review')
    setReason('')
    setFeedback('')
    setError('')
    onSelectVersion(id)
  }

  function beginDecision(nextMode) {
    setMode(nextMode)
    setFeedback('')
    setError('')
  }

  function submitDecision(event) {
    event.preventDefault()

    const result = onDecision(
      quotation.id,
      mode === 'accept' ? 'approved' : 'rejected',
      reason.trim(),
    )

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMode('review')
    setReason('')
    setError('')
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
        onClose()
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
          onClick={onClose}
          aria-label="Close quotation"
          autoFocus
        >
          <XIcon size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="qt-dialog-body">
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
              <p>No sample PDF is attached to these demo records.</p>
            </div>

            <button
              type="button"
              className="qt-button qt-button--secondary"
              disabled
              title="A published quotation PDF is required."
            >
              <DownloadSimpleIcon size={17} aria-hidden="true" />
              Download
            </button>
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
            <h3>
              {mode === 'accept'
                ? 'Accept this quotation?'
                : 'Reject this quotation?'}
            </h3>

            <p>
              {mode === 'accept'
                ? `You are accepting version ${quotation.version} for ${formatMoney(
                    quotation.total,
                    quotation.currency,
                  )}. Review the proposed work and terms before confirming.`
                : `You are rejecting version ${quotation.version}. You may add a reason for the team.`}
            </p>

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
              Preview only. This decision changes the demo on this page.
            </p>

            <div className="qt-button-row">
              <button type="submit" className="qt-button">
                {mode === 'accept'
                  ? 'Confirm acceptance'
                  : 'Confirm rejection'}
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
        <span>Demo quotation · No payment is collected here</span>

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
              onClick={onClose}
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
}) {
  const [quotations, setQuotations] = useState(createDemoQuotations)
  const [now, setNow] = useState(() => Date.now())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
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
      (siteFilter === 'all' || equipment.site_name === siteFilter)
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
  }

  function resetPreview() {
    setSelectedId(null)
    setQuotations(createDemoQuotations())
    setNow(Date.now())
    clearFilters()
  }

  function decideQuotation(id, decision, rejectionReason) {
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

    setQuotations(items =>
      items.map(item =>
        item.id === id
          ? {
              ...item,
              status: decision,
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
      <a className="qt-skip-link" href="#qt-main">
        Skip to quotations
      </a>

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
            <strong>Quotations</strong>
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
              <h1>Quotations</h1>
              <p>
                Review proposed work, check the price and record your decision.
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

            <div className="qt-results-line" role="status" aria-live="polite">
              <span>
                Showing {visibleQuotations.length} of{' '}
                {currentQuotations.length} quotations
              </span>

              {search || statusFilter !== 'all' || siteFilter !== 'all' ? (
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
            onOpenService={onOpenService}
            onOpenInspection={onOpenInspection}
          />
        ) : null}
      </main>
    </div>
  )
}