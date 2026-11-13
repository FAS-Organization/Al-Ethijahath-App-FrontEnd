import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  FilePdfIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react'

import {
  MAINTENANCE_PREVIEW_DATA,
  ALTERNATIVE_PREVIEW,
} from '../data/maintenancePreviewData'
import './AmcSchedulePage.css'

const TZ = 'Asia/Riyadh'
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const OPEN_REQUEST = ['pending', 'alternative_proposed']
const SUMMARIES_SHOWN = 3

const APPOINTMENT_STATUS = {
  planned: 'Planned',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  missed: 'Missed',
}

const PURPOSE = {
  inspection: 'Inspection',
  maintenance: 'Maintenance',
  repair: 'Repair',
}

const REQUEST_STATUS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  alternative_proposed: 'Alternative proposed',
  withdrawn: 'Withdrawn',
}

const CONTRACT_STATUS = {
  active: 'Active',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

const SERVICE_STATUS_TEXT = {
  not_started: 'not started',
  inspection: 'in inspection',
  awaiting_approval: 'awaiting approval',
  quotation: 'in quotation',
  quotation_approved: 'quotation approved',
  scheduled: 'scheduled',
  awaiting_parts: 'awaiting parts',
  in_progress: 'in progress',
  on_hold: 'on hold',
}

// ---------- Helpers ----------

function parse(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function fmtDate(value) {
  const date = parse(value)
  if (!date) return 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: DATE_ONLY.test(value) ? 'UTC' : TZ,
  }).format(date)
}

function fmtShort(value) {
  const date = parse(value)
  if (!date) return 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: DATE_ONLY.test(value) ? 'UTC' : TZ,
  }).format(date)
}

function fmtTime(value) {
  const date = parse(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(date)
}

function fmtMonth(value) {
  const date = parse(value)
  if (!date) return 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function dayKey(value) {
  const date = value instanceof Date ? value : parse(value)
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date)
}

function tileParts(value) {
  const date = parse(value)
  if (!date) return { day: '—', month: '' }
  return {
    day: new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: TZ }).format(date),
    month: new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: TZ }).format(date),
  }
}

function dateTimeLabel(start, end) {
  return `${fmtDate(start)}, ${fmtTime(start)}–${fmtTime(end)}`
}

function months(count) {
  return `${count} ${count === 1 ? 'month' : 'months'}`
}

function badgeTone(status) {
  if (['active', 'confirmed', 'completed', 'accepted', 'visit'].includes(status)) return 'good'
  if (['planned', 'in_progress', 'pending', 'alternative_proposed', 'unscheduled'].includes(status)) return 'warn'
  if (['expired', 'cancelled', 'withdrawn'].includes(status)) return 'muted'
  return 'accent'
}

function Badge({ status, children }) {
  return <span className={`sc-badge sc-badge--${badgeTone(status)}`}>{children}</span>
}

function Specification({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value === null || value === undefined || value === '' ? 'Not recorded' : value}</dd>
    </div>
  )
}

function ActionButton({ children, available = true, onClick, title }) {
  return (
    <button
      className="sc-action"
      type="button"
      disabled={!available}
      title={!available ? title || 'This destination is not connected yet.' : undefined}
      onClick={onClick}
    >
      {children}
      <ArrowRightIcon size={16} aria-hidden="true" />
    </button>
  )
}

function isUpcoming(appointment, now) {
  return (
    ['planned', 'confirmed', 'in_progress'].includes(appointment.status) &&
    parse(appointment.scheduled_end) >= now
  )
}

// ---------- Shared building blocks ----------

function Tabs({ tabs, value, onChange, label }) {
  function onKey(event, index) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const step = event.key === 'ArrowRight' ? 1 : -1
    const next = tabs[(index + step + tabs.length) % tabs.length]
    onChange(next.id)
    document.getElementById(`sc-tab-${next.id}`)?.focus()
  }

  return (
    <div className="sc-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`sc-tab-${tab.id}`}
          role="tab"
          type="button"
          className="sc-tab"
          aria-selected={value === tab.id}
          aria-controls={`sc-panel-${tab.id}`}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={event => onKey(event, index)}
        >
          {tab.label}
          {tab.count != null && <span className="sc-tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

function Modal({ open, onClose, labelledBy, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  function closeFromBackdrop(event) {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    if (outside) onClose()
  }

  return (
    <dialog
      ref={ref}
      className="sc-dialog"
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={closeFromBackdrop}
    >
      {open ? children : null}
    </dialog>
  )
}

function Message({ icon: Icon, title, children, action }) {
  return (
    <div className="sc-message">
      {Icon && <Icon size={32} aria-hidden="true" />}
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  )
}

function PdfControl({ url, label = 'Contract PDF' }) {
  return url ? (
    <a className="sc-action" href={url} target="_blank" rel="noreferrer">
      <FilePdfIcon size={16} aria-hidden="true" /> {label}
    </a>
  ) : (
    <button className="sc-action" type="button" disabled title="Sample PDF unavailable">
      <FilePdfIcon size={16} aria-hidden="true" /> Sample PDF unavailable
    </button>
  )
}

// ---------- Current contract (shown in full on the page) ----------

function CurrentContract({ contract, rows, stats, handlers }) {
  return (
    <article className="sc-current" aria-labelledby={`sc-current-${contract.id}`}>
      <div className="sc-current-head">
        <span className="sc-card-icon">
          <FileTextIcon size={26} aria-hidden="true" />
        </span>
        <div className="sc-card-title">
          <h3 id={`sc-current-${contract.id}`}>{contract.contract_number}</h3>
          <p>
            {fmtDate(contract.start_date)} – {fmtDate(contract.end_date)} · Every {months(contract.interval_months)}
          </p>
        </div>
        <Badge status={contract.status}>{CONTRACT_STATUS[contract.status]}</Badge>
        <PdfControl url={contract.pdf_url} />
      </div>

      <dl className="sc-stats">
        <div className="sc-stat">
          <dt>Covered machines</dt>
          <dd>{stats.covered}</dd>
        </div>
        <div className="sc-stat">
          <dt>Next service due</dt>
          <dd>{stats.nextDue ? fmtDate(stats.nextDue) : 'Not recorded'}</dd>
        </div>
        <div className={`sc-stat${stats.overdue ? ' sc-stat--alert' : ''}`}>
          <dt>Overdue machines</dt>
          <dd>{stats.overdue}</dd>
        </div>
        <div className="sc-stat">
          <dt>Visits scheduled</dt>
          <dd>{stats.visits}</dd>
        </div>
      </dl>

      <div className="sc-section-title sc-section-title--sub">
        <h4>Covered machines and updates</h4>
        <span className="sc-count">{rows.length}</span>
      </div>

      {!rows.length ? (
        <p className="sc-muted">No covered machines match your search.</p>
      ) : (
        <ul className="sc-machines">
          {rows.map(row => (
            <li key={row.coverage.id}>
              <article className={`sc-machine${row.overdue ? ' sc-machine--overdue' : ''}`}>
                <div className="sc-machine-top">
                  <span className="sc-machine-icon">
                    <TruckIcon size={22} aria-hidden="true" />
                  </span>
                  <div className="sc-machine-title">
                    <h5>{row.equipment.name}</h5>
                    <p>
                      {row.equipment.asset} · {row.equipment.serial}
                    </p>
                  </div>
                  <Badge status={row.state.tone}>{row.state.label}</Badge>
                </div>

                <dl className="sc-machine-dates">
                  <div>
                    <dt>Last service</dt>
                    <dd>
                      {row.coverage.last_completed_service_date
                        ? fmtDate(row.coverage.last_completed_service_date)
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Next due</dt>
                    <dd className={row.overdue ? 'sc-overdue' : ''}>
                      {fmtDate(row.coverage.next_service_due_date)}
                    </dd>
                  </div>
                  <div>
                    <dt>Interval</dt>
                    <dd>
                      Every {months(row.interval)}
                      {row.override && <small>Equipment override</small>}
                    </dd>
                  </div>
                </dl>

                <p className={`sc-machine-update${row.overdue ? ' is-alert' : ''}`}>
                  {row.overdue ? (
                    <WarningCircleIcon size={18} aria-hidden="true" />
                  ) : (
                    <CalendarBlankIcon size={18} aria-hidden="true" />
                  )}
                  <span>{row.note}</span>
                </p>

                <div className="sc-machine-foot">
                  <p className="sc-machine-site">
                    {row.site?.name || 'Site not recorded'}
                    <small>
                      Covered {fmtShort(row.coverage.start_date)} – {fmtDate(row.coverage.end_date)}
                    </small>
                  </p>

                  <div className="sc-cell-actions">
                    <ActionButton
                      available={Boolean(handlers.onOpenEquipment)}
                      onClick={() => handlers.onOpenEquipment?.(row.equipment.id)}
                    >
                      View equipment
                    </ActionButton>
                    <ActionButton
                      available={Boolean(handlers.onOpenServiceHistory)}
                      onClick={() => handlers.onOpenServiceHistory?.(row.equipment.id)}
                    >
                      Service history
                    </ActionButton>
                    {row.visit && (
                      <ActionButton
                        available={Boolean(handlers.onOpenAppointment)}
                        onClick={() => handlers.onOpenAppointment?.(row.visit)}
                      >
                        Scheduled visit
                      </ActionButton>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <p className="sc-note">
        Due dates are maintenance targets, not confirmed visits. AMC coverage does not automatically make every repair
        free of charge. Customers cannot edit contracts, coverage or due dates.
      </p>
    </article>
  )
}
// ---------- Previous contracts (compact cards + popup) ----------

function ContractCard({ contract, count, onView }) {
  return (
    <article className="sc-card sc-card--previous">
      <div className="sc-card-header">
        <span className="sc-card-icon">
          <FileTextIcon size={26} aria-hidden="true" />
        </span>
        <div className="sc-card-title">
          <h3>{contract.contract_number}</h3>
          <p>
            {fmtDate(contract.start_date)} – {fmtDate(contract.end_date)}
          </p>
        </div>
        <Badge status={contract.status}>{CONTRACT_STATUS[contract.status]}</Badge>
      </div>

      <dl className="sc-facts">
        <Specification label="Standard service interval" value={`Every ${months(contract.interval_months)}`} />
        <Specification label="Covered equipment" value={count} />
      </dl>

      <p className="sc-note">Historical coverage. It does not count as current coverage.</p>

      <div className="sc-card-actions">
        <button className="sc-trigger" type="button" aria-haspopup="dialog" onClick={onView}>
          <span>View coverage</span>
          <ArrowRightIcon size={18} aria-hidden="true" />
        </button>
        <PdfControl url={contract.pdf_url} />
      </div>
    </article>
  )
}

function ContractDetail({ contract, rows, onClose, handlers }) {
  const titleId = useId()

  return (
    <>
      <header className="sc-dialog-header">
        <div>
          <h2 id={titleId}>{contract.contract_number}</h2>
          <p>
            {CONTRACT_STATUS[contract.status]} · {fmtDate(contract.start_date)} – {fmtDate(contract.end_date)}
          </p>
        </div>
        <button className="sc-close" type="button" aria-label="Close contract details" onClick={onClose}>
          <XIcon size={22} aria-hidden="true" />
        </button>
      </header>

      <div className="sc-dialog-scroll">
        <dl className="sc-facts sc-facts--three">
          <Specification label="Start date" value={fmtDate(contract.start_date)} />
          <Specification label="End date" value={fmtDate(contract.end_date)} />
          <Specification label="Standard interval" value={`Every ${months(contract.interval_months)}`} />
        </dl>

        <div className="sc-doc-row">
          <PdfControl url={contract.pdf_url} label="View / download contract PDF" />
        </div>

        <section className="sc-dialog-section">
          <div className="sc-section-title">
            <h3>Covered equipment</h3>
            <span className="sc-count">{rows.length}</span>
          </div>

          <div className="sc-table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  <th scope="col">Equipment</th>
                  <th scope="col">Asset / serial</th>
                  <th scope="col">Site</th>
                  <th scope="col">Coverage dates</th>
                  <th scope="col">Service interval</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.coverage.id}>
                    <th scope="row">{row.equipment.name}</th>
                    <td>
                      {row.equipment.asset}
                      <small>{row.equipment.serial}</small>
                    </td>
                    <td>{row.site?.name || 'Not recorded'}</td>
                    <td>
                      {fmtDate(row.coverage.start_date)} – {fmtDate(row.coverage.end_date)}
                    </td>
                    <td>
                      {months(row.interval)}
                      {row.override && <small>Equipment override</small>}
                    </td>
                    <td>
                      <div className="sc-cell-actions">
                        <ActionButton
                          available={Boolean(handlers.onOpenEquipment)}
                          onClick={() => handlers.onOpenEquipment?.(row.equipment.id)}
                        >
                          View equipment
                        </ActionButton>
                        <ActionButton
                          available={Boolean(handlers.onOpenServiceHistory)}
                          onClick={() => handlers.onOpenServiceHistory?.(row.equipment.id)}
                        >
                          View service history
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="sc-note">
            This contract has ended, so it does not count as current coverage and has no active due dates.
          </p>
        </section>
      </div>
    </>
  )
}

// ---------- Appointment card ----------

function AppointmentCard({ appointment, equipment, site, request, eligible, handlers, onReschedule }) {
  const tile = tileParts(appointment.scheduled_start)
  const completed = appointment.status === 'completed'

  return (
    <article className="sc-appointment">
      <div className="sc-tile" aria-hidden="true">
        <strong>{tile.day}</strong>
        <span>{tile.month}</span>
      </div>

      <div className="sc-appointment-body">
        <div className="sc-appointment-head">
          <div>
            <h3>
              {appointment.reference} · {equipment?.name || 'Equipment not recorded'}
            </h3>
            <p className="sc-muted">
              {fmtDate(appointment.scheduled_start)} · {fmtTime(appointment.scheduled_start)}–
              {fmtTime(appointment.scheduled_end)} Saudi time
            </p>
          </div>
          <div className="sc-badges">
            <Badge status="accent">{PURPOSE[appointment.purpose]}</Badge>
            <Badge status="muted">{appointment.is_amc ? 'AMC' : 'Non-AMC'}</Badge>
            <Badge status={appointment.status}>{APPOINTMENT_STATUS[appointment.status]}</Badge>
          </div>
        </div>

        <dl className="sc-facts">
          <Specification label="Site" value={site ? `${site.name} · ${site.address}` : null} />
          <Specification label="Technician" value={appointment.technician || 'Not assigned'} />
          {appointment.amc_due_date && (
            <Specification label="Original AMC due date" value={fmtDate(appointment.amc_due_date)} />
          )}
          {request && (
            <div>
              <dt>Reschedule request</dt>
              <dd>
                <Badge status={request.status}>{REQUEST_STATUS[request.status]}</Badge>
              </dd>
            </div>
          )}
        </dl>

        <div className="sc-card-actions">
          <ActionButton
            available={Boolean(handlers.onOpenService)}
            onClick={() => handlers.onOpenService?.(appointment.reference)}
          >
            View service job
          </ActionButton>

          {completed && appointment.has_completion_card && (
            <ActionButton
              available={Boolean(handlers.onOpenCompletion)}
              onClick={() => handlers.onOpenCompletion?.(appointment.reference)}
            >
              View completion card
            </ActionButton>
          )}

          {eligible && (
            <button className="sc-action sc-action--solid" type="button" aria-haspopup="dialog" onClick={onReschedule}>
              <ArrowsClockwiseIcon size={16} aria-hidden="true" /> Request reschedule
            </button>
          )}
        </div>

        {request && OPEN_REQUEST.includes(request.status) && (
          <p className="sc-note">Your existing appointment remains scheduled until a change is confirmed.</p>
        )}
      </div>
    </article>
  )
}

// ---------- Reschedule form ----------

function RescheduleForm({ appointment, equipment, site, minDate, today, onSubmit, onClose }) {
  const titleId = useId()
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')

  function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    const next = {}

    if (!values.date) next.date = 'Choose the date you would like.'
    else if (values.date <= today) next.date = 'Choose a future date.'
    else if (values.date === dayKey(appointment.scheduled_start)) {
      next.date = 'Choose a date different from your current appointment.'
    }
    if (!values.reason?.trim()) next.reason = 'Tell us why you need a different date.'

    setErrors(next)
    setFailure('')
    const first = Object.keys(next)[0]
    if (first) {
      form.elements[first].focus()
      return
    }

    try {
      onSubmit({ appointment, date: values.date, reason: values.reason.trim() })
      onClose()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Unable to submit the request.')
    }
  }

  return (
    <>
      <header className="sc-dialog-header">
        <div>
          <h2 id={titleId}>Request a different date</h2>
          <p>
            {appointment.reference} · {equipment?.name}
          </p>
        </div>
        <button className="sc-close" type="button" aria-label="Close reschedule request" onClick={onClose}>
          <XIcon size={22} aria-hidden="true" />
        </button>
      </header>

      <form className="sc-form" noValidate onSubmit={submit}>
        <div className="sc-dialog-scroll">
          <dl className="sc-facts">
            <Specification label="Equipment and service" value={`${equipment?.name} · ${appointment.reference}`} />
            <Specification label="Site" value={site?.name} />
            <Specification
              label="Existing appointment (Saudi time)"
              value={dateTimeLabel(appointment.scheduled_start, appointment.scheduled_end)}
            />
          </dl>

          <div className="sc-field">
            <label htmlFor="rs-date">Requested new date</label>
            <input
              id="rs-date"
              name="date"
              type="date"
              min={minDate}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'rs-date-error' : undefined}
            />
            {errors.date && (
              <p className="sc-error" id="rs-date-error">
                {errors.date}
              </p>
            )}
          </div>

          <div className="sc-field">
            <label htmlFor="rs-reason">Reason</label>
            <textarea
              id="rs-reason"
              name="reason"
              rows="4"
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={errors.reason ? 'rs-reason-error' : undefined}
            />
            {errors.reason && (
              <p className="sc-error" id="rs-reason-error">
                {errors.reason}
              </p>
            )}
          </div>

          <p className="sc-note">
            Your requested date needs confirmation from our team. Your existing appointment remains scheduled until a
            change is confirmed.
          </p>
          {failure && (
            <p className="sc-error" role="alert">
              {failure}
            </p>
          )}
        </div>

        <footer className="sc-dialog-footer">
          <button className="sc-action" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="sc-action sc-action--solid" type="submit">
            Submit request
          </button>
        </footer>
      </form>
    </>
  )
}

// ---------- Page content ----------

function ScheduleContent({ data, handlers }) {
  const now = useMemo(() => (data.now ? new Date(data.now) : new Date()), [data.now])
  const today = dayKey(now)
  const minDate = useMemo(() => {
    const next = new Date(`${today}T00:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 1)
    return next.toISOString().slice(0, 10)
  }, [today])

  const [tab, setTab] = useState('contracts')
  const [query, setQuery] = useState('')
  const [contractStatus, setContractStatus] = useState('all')
  const [contractSite, setContractSite] = useState('all')
  const [view, setView] = useState('upcoming')
  const [siteFilter, setSiteFilter] = useState('all')
  const [equipmentFilter, setEquipmentFilter] = useState('all')
  const [purposeFilter, setPurposeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [appointments, setAppointments] = useState(data.appointments)
  const [requests, setRequests] = useState(data.reschedule_requests)
  const [openContract, setOpenContract] = useState(null)
  const [rescheduleId, setRescheduleId] = useState(null)
  const [message, setMessage] = useState('')
  const [showAllSummaries, setShowAllSummaries] = useState(false)

  // Customers never see internal draft contracts.
  const contracts = data.contracts.filter(contract => contract.status !== 'draft')
  const equipmentById = useMemo(() => new Map(data.equipment.map(item => [item.id, item])), [data.equipment])
  const siteById = useMemo(() => new Map(data.sites.map(item => [item.id, item])), [data.sites])
  const contractById = useMemo(() => new Map(contracts.map(item => [item.id, item])), [contracts])

  function isCurrent(coverage) {
    const contract = contractById.get(coverage.contract_id)
    const equipment = equipmentById.get(coverage.equipment_id)
    const within = (start, end) => start <= today && today <= end
    return Boolean(
      contract &&
        contract.status === 'active' &&
        within(contract.start_date, contract.end_date) &&
        coverage.is_active &&
        within(coverage.start_date, coverage.end_date) &&
        equipment &&
        !equipment.is_retired
    )
  }

  const currentCoverages = data.coverages.filter(isCurrent)

  function upcomingVisitFor(equipmentId) {
    return appointments
      .filter(
        a =>
          a.equipment_id === equipmentId &&
          ['planned', 'confirmed'].includes(a.status) &&
          parse(a.scheduled_start) > now
      )
      .sort((a, b) => parse(a.scheduled_start) - parse(b.scheduled_start))[0]
  }

  function latestRequest(appointmentId) {
    return requests
      .filter(r => r.appointment_id === appointmentId)
      .sort((a, b) => parse(b.submitted_at) - parse(a.submitted_at))[0]
  }

  function isEligible(appointment) {
    return (
      ['planned', 'confirmed'].includes(appointment.status) &&
      parse(appointment.scheduled_start) > now &&
      !requests.some(r => r.appointment_id === appointment.id && OPEN_REQUEST.includes(r.status))
    )
  }

  function dueNote(coverage) {
    const visit = upcomingVisitFor(coverage.equipment_id)
    const related = data.related_services.find(service => service.equipment_id === coverage.equipment_id)
    const overdue = coverage.next_service_due_date < today
    if (overdue && related) {
      return `Maintenance overdue · Related service ${related.reference} is ${
        SERVICE_STATUS_TEXT[related.status] || 'open'
      }.`
    }
    if (visit) {
      return `Visit ${visit.reference} ${APPOINTMENT_STATUS[visit.status].toLowerCase()} for ${fmtShort(
        visit.scheduled_start
      )}.`
    }
    if (overdue) return 'Maintenance overdue · No visit scheduled.'
    return `Next maintenance due ${fmtShort(coverage.next_service_due_date)} · Visit not yet scheduled.`
  }

  function rowsFor(contractId) {
    const contract = contractById.get(contractId)
    return data.coverages
      .filter(coverage => coverage.contract_id === contractId)
      .map(coverage => {
        const equipment = equipmentById.get(coverage.equipment_id)
        const current = contract?.status === 'active' && isCurrent(coverage)
        const overdue = current && coverage.next_service_due_date < today
        const visit = current ? upcomingVisitFor(coverage.equipment_id) : null
        const state = overdue
          ? { tone: 'accent', label: 'Overdue' }
          : visit
            ? { tone: 'visit', label: 'Visit scheduled' }
            : { tone: 'unscheduled', label: 'No visit scheduled' }

        return {
          coverage,
          equipment,
          site: siteById.get(equipment?.site_id),
          override: coverage.interval_months_override != null,
          interval: coverage.interval_months_override ?? contract?.interval_months,
          overdue,
          current,
          state,
          note: current ? dueNote(coverage) : '',
          visit,
        }
      })
      .filter(row => row.equipment)
  }

  // ----- Summary (derived from the records) -----
  const stats = {
    contracts: contracts.filter(c => c.status === 'active').length,
    covered: new Set(currentCoverages.map(c => c.equipment_id)).size,
    visits: appointments.filter(
      a => ['planned', 'confirmed'].includes(a.status) && parse(a.scheduled_start) > now
    ).length,
    open: requests.filter(r => OPEN_REQUEST.includes(r.status)).length,
  }

  // ----- Contract filtering -----
  const needle = query.trim().toLowerCase()
  const filtersActive = Boolean(needle) || contractSite !== 'all' || contractStatus !== 'all'

  function rowMatches(row, contract) {
    const text = `${row.equipment.name} ${row.equipment.asset} ${row.equipment.serial}`.toLowerCase()
    const contractHit = contract.contract_number.toLowerCase().includes(needle)
    const matchesText = !needle || contractHit || text.includes(needle)
    const matchesSite = contractSite === 'all' || String(row.equipment.site_id) === contractSite
    return matchesText && matchesSite
  }

  const currentPanels = contracts
    .filter(c => c.status === 'active' && (contractStatus === 'all' || contractStatus === 'active'))
    .map(contract => {
      const allRows = rowsFor(contract.id)
      const shownRows = allRows.filter(row => rowMatches(row, contract))
      const dueDates = allRows
        .filter(row => row.current && row.coverage.next_service_due_date)
        .map(row => row.coverage.next_service_due_date)
        .sort()
      return {
        contract,
        rows: shownRows,
        stats: {
          covered: allRows.filter(row => row.current).length,
          nextDue: dueDates[0] || null,
          overdue: allRows.filter(row => row.overdue).length,
          visits: allRows.filter(row => row.visit).length,
        },
      }
    })
    .filter(panel => !filtersActive || panel.rows.length > 0)

  const previousContracts = contracts
    .filter(c => c.status !== 'active')
    .filter(c => contractStatus === 'all' || c.status === contractStatus)
    .filter(c => rowsFor(c.id).some(row => rowMatches(row, c)))

  const visibleContractCount = currentPanels.length + previousContracts.length

  // ----- Monthly summaries: finished months only, newest first -----
  const finishedSummaries = data.monthly_summaries
    .filter(entry => {
      const start = parse(entry.month_start)
      if (!start) return false
      const monthEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
      return monthEnd <= now
    })
    .sort((a, b) => parse(b.month_start) - parse(a.month_start))
  const shownSummaries = showAllSummaries ? finishedSummaries : finishedSummaries.slice(0, SUMMARIES_SHOWN)

  // ----- Appointment filtering -----
  const visibleAppointments = appointments
    .filter(a => {
      const upcoming = isUpcoming(a, now)
      if (view === 'upcoming' && !upcoming) return false
      if (view === 'past' && upcoming) return false
      if (siteFilter !== 'all' && String(a.site_id) !== siteFilter) return false
      if (equipmentFilter !== 'all' && a.equipment_id !== equipmentFilter) return false
      if (purposeFilter !== 'all' && a.purpose !== purposeFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      return true
    })
    .sort((a, b) =>
      view === 'past'
        ? parse(b.scheduled_start) - parse(a.scheduled_start)
        : parse(a.scheduled_start) - parse(b.scheduled_start)
    )

  const dueWithoutVisit =
    view !== 'past' && purposeFilter === 'all' && statusFilter === 'all'
      ? currentCoverages
          .filter(coverage => !upcomingVisitFor(coverage.equipment_id))
          .filter(coverage => equipmentFilter === 'all' || coverage.equipment_id === equipmentFilter)
          .filter(coverage => {
            const equipment = equipmentById.get(coverage.equipment_id)
            return siteFilter === 'all' || String(equipment?.site_id) === siteFilter
          })
          .filter(coverage => coverage.next_service_due_date)
      : []

  const scheduleEquipment = data.equipment.filter(item => appointments.some(a => a.equipment_id === item.id))
  const sortedRequests = [...requests].sort((a, b) => parse(b.submitted_at) - parse(a.submitted_at))
  const rescheduleAppointment = appointments.find(a => a.id === rescheduleId)
  const contractToShow = contractById.get(openContract)

  // ----- Demo request actions (backend transition rules still pending) -----
  function addRequest({ appointment, date, reason }) {
    if (!isEligible(appointment)) {
      throw new Error('This appointment already has an open request or cannot be rescheduled.')
    }
    setRequests(list => [
      {
        id: `rr-demo-${list.length + 1}`,
        appointment_id: appointment.id,
        reference: appointment.reference,
        equipment_id: appointment.equipment_id,
        original_start: appointment.scheduled_start,
        requested_date: date,
        reason,
        submitted_at: now.toISOString(),
        status: 'pending',
        responded_at: null,
        notes: null,
        alternative_date: null,
        alternative_note: null,
        customer_response: null,
      },
      ...list,
    ])
    setMessage('Demo reschedule request submitted.')
  }

  function updateRequest(id, changes) {
    setRequests(list => list.map(r => (r.id === id ? { ...r, ...changes } : r)))
  }

  function withdraw(request) {
    updateRequest(request.id, {
      status: 'withdrawn',
      responded_at: now.toISOString(),
      notes: 'You withdrew this request.',
    })
    setMessage('Demo request withdrawn. Your appointment is unchanged.')
  }

  function acceptAlternative(request) {
    updateRequest(request.id, { customer_response: 'accepted_alternative' })
    setMessage(
      `You accepted ${fmtShort(request.alternative_date)}. The exact time still needs confirmation from our team.`
    )
  }

  function demoConfirm(request) {
    const start = `${request.alternative_date}T10:00:00+03:00`
    const end = `${request.alternative_date}T11:00:00+03:00`
    updateRequest(request.id, {
      status: 'accepted',
      responded_at: now.toISOString(),
      confirmed_start: start,
      confirmed_end: end,
      notes: 'Visit confirmed with an explicit time (demo).',
    })
    setAppointments(list =>
      list.map(a => (a.id === request.appointment_id ? { ...a, scheduled_start: start, scheduled_end: end } : a))
    )
    setMessage(`Demo: appointment moved to ${dateTimeLabel(start, end)}.`)
  }

  const alternativeRequest = requests.find(r => r.id === ALTERNATIVE_PREVIEW.id)
  const alternativeOn = alternativeRequest?.status === 'alternative_proposed'
  const canTogglePreview =
    alternativeRequest && OPEN_REQUEST.includes(alternativeRequest.status) && !alternativeRequest.customer_response

  function togglePreview(on) {
    updateRequest(
      ALTERNATIVE_PREVIEW.id,
      on
        ? {
            status: 'alternative_proposed',
            alternative_date: ALTERNATIVE_PREVIEW.alternative_date,
            alternative_note: ALTERNATIVE_PREVIEW.alternative_note,
            responded_at: now.toISOString(),
          }
        : {
            status: 'pending',
            alternative_date: null,
            alternative_note: null,
            responded_at: null,
          }
    )
  }

  function clearContractFilters() {
    setQuery('')
    setContractStatus('all')
    setContractSite('all')
  }

  function clearScheduleFilters() {
    setSiteFilter('all')
    setEquipmentFilter('all')
    setPurposeFilter('all')
    setStatusFilter('all')
  }

  const summary = [
    { label: 'Active AMC contracts', value: stats.contracts, icon: FileTextIcon },
    { label: 'Equipment currently covered', value: stats.covered, icon: CheckCircleIcon },
    { label: 'Upcoming visits', value: stats.visits, icon: CalendarBlankIcon },
    { label: 'Open reschedule requests', value: stats.open, icon: ArrowsClockwiseIcon },
  ]

  const hasActiveContract = contracts.some(c => c.status === 'active')

  return (
    <>
      {data.is_demo && (
        <p className="sc-demo-notice">
          Preview mode · Fictional records for Riyadh. No live backend connection. No email or notification is sent.
        </p>
      )}

      <section className="sc-summary" aria-label="Schedule summary">
        {summary.map(({ label, value, icon: Icon }) => (
            <div className="sc-summary-item" key={label}>
              <span className="sc-summary-icon" aria-hidden="true">
                <Icon size={23} />
              </span>

              <div className="sc-summary-copy">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>

              <span className="sc-summary-corner" aria-hidden="true">
                <Icon size={60} weight="thin" />
              </span>
            </div>
          ))}
      </section>

      <p className="sc-notice" role="status" aria-live="polite">
        {message}
      </p>

      <Tabs
        label="AMC and service schedule sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'contracts', label: 'Contracts & coverage', count: contracts.length },
          { id: 'schedule', label: 'Service schedule', count: stats.visits },
          { id: 'requests', label: 'Reschedule requests', count: requests.length },
        ]}
      />

      {/* ---------------- Contracts & coverage ---------------- */}
      {tab === 'contracts' && (
        <section id="sc-panel-contracts" role="tabpanel" aria-labelledby="sc-tab-contracts" className="sc-panel">
          {!contracts.length ? (
            <Message icon={FileTextIcon} title="No AMC contracts">
              Your account has no AMC contract yet. You can still see inspection and repair visits in the Service
              schedule tab.
            </Message>
          ) : (
            <>
              <div className="sc-toolbar">
                <label className="sc-search">
                  <span className="sc-sr">Search contracts and equipment</span>
                  <MagnifyingGlassIcon size={20} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search contract number, equipment, asset number or serial number"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                </label>

                <div className="sc-filters">
                  <label>
                    <span>Contract status</span>
                    <select value={contractStatus} onChange={event => setContractStatus(event.target.value)}>
                      <option value="all">All statuses</option>
                      {Object.entries(CONTRACT_STATUS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Site</span>
                    <select value={contractSite} onChange={event => setContractSite(event.target.value)}>
                      <option value="all">All sites</option>
                      {data.sites.map(site => (
                        <option key={site.id} value={String(site.id)}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <p className="sc-results" role="status" aria-live="polite">
                Showing {visibleContractCount} of {contracts.length} contracts
              </p>

              {filtersActive && visibleContractCount === 0 && (
                <Message
                  title="No matching contracts"
                  action={
                    <button type="button" className="sc-message-button" onClick={clearContractFilters}>
                      Clear filters
                    </button>
                  }
                >
                  Try a different search or change your filters.
                </Message>
              )}

              {/* Current contract, in full */}
              {(currentPanels.length > 0 || (!filtersActive && !hasActiveContract)) && (
                <section className="sc-section" aria-labelledby="sc-current-title">
                  <div className="sc-section-title sc-section-title--main">
                    <h2 id="sc-current-title">Current AMC contract</h2>
                  </div>

                  {currentPanels.length > 0 ? (
                    <div className="sc-stack">
                      {currentPanels.map(panel => (
                        <CurrentContract
                          key={panel.contract.id}
                          contract={panel.contract}
                          rows={panel.rows}
                          stats={panel.stats}
                          handlers={handlers}
                        />
                      ))}
                    </div>
                  ) : (
                    <Message icon={FileTextIcon} title="No active AMC contract">
                      Your previous contracts are listed below. Contact our team if your coverage should be active.
                    </Message>
                  )}
                </section>
              )}

              {/* Earlier contracts, compact */}
              {previousContracts.length > 0 && (
                <section className="sc-section" aria-labelledby="sc-previous-title">
                  <div className="sc-section-title sc-section-title--main">
                    <h2 id="sc-previous-title">Previous contracts</h2>
                    <span className="sc-count">{previousContracts.length}</span>
                  </div>
                  <div className="sc-grid">
                    {previousContracts.map(contract => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        count={data.coverages.filter(c => c.contract_id === contract.id).length}
                        onView={() => setOpenContract(contract.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Monthly summaries */}
          <section className="sc-block" aria-labelledby="sc-monthly">
            <div className="sc-section-title">
              <h2 id="sc-monthly">Monthly summaries</h2>
              <span className="sc-count">{finishedSummaries.length}</span>
            </div>
            <p className="sc-note">
              Summaries cover finished months, newest first. Summary generation and delivery are still pending in the
              backend, so these are preview entries only.
            </p>

            {!finishedSummaries.length ? (
              <p className="sc-muted">No monthly summaries are available yet.</p>
            ) : (
              <>
                <div className="sc-grid">
                  {shownSummaries.map(entry => (
                    <article className="sc-card" key={entry.id}>
                      <div className="sc-card-header">
                        <span className="sc-card-icon">
                          <CalendarBlankIcon size={26} aria-hidden="true" />
                        </span>
                        <div className="sc-card-title">
                          <h3>{fmtMonth(entry.month_start)}</h3>
                          <p>{entry.contract_number}</p>
                        </div>
                        <Badge status="good">
                          {entry.completed_count} completed AMC {entry.completed_count === 1 ? 'service' : 'services'}
                        </Badge>
                      </div>

                      <dl className="sc-facts">
                        <Specification
                          label="Equipment serviced"
                          value={entry.equipment.map(item => `${item.name}, ${item.asset}`).join('; ')}
                        />
                        <Specification label="Site" value={entry.site_name} />
                      </dl>
                      <p>{entry.summary}</p>

                      <div className="sc-card-actions">
                        {entry.services.map(service => (
                          <ActionButton
                            key={service.reference}
                            available={Boolean(handlers.onOpenService)}
                            onClick={() => handlers.onOpenService?.(service.reference)}
                          >
                            Service {service.reference}
                          </ActionButton>
                        ))}
                        {entry.pdf_url && (
                          <a className="sc-action" href={entry.pdf_url} target="_blank" rel="noreferrer">
                            <FilePdfIcon size={16} aria-hidden="true" /> Sample summary PDF
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {finishedSummaries.length > SUMMARIES_SHOWN && (
                  <div className="sc-more-row">
                    <button
                      className="sc-action"
                      type="button"
                      aria-expanded={showAllSummaries}
                      onClick={() => setShowAllSummaries(value => !value)}
                    >
                      {showAllSummaries ? 'Show fewer summaries' : 'Show older summaries'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      )}

      {/* ---------------- Service schedule ---------------- */}
      {tab === 'schedule' && (
        <section id="sc-panel-schedule" role="tabpanel" aria-labelledby="sc-tab-schedule" className="sc-panel">
          <div className="sc-toolbar">
            <div className="sc-segments" role="group" aria-label="Show visits">
              {[
                ['upcoming', 'Upcoming'],
                ['past', 'Past'],
                ['all', 'All'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="sc-segment"
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="sc-filters sc-filters--four">
              <label>
                <span>Site</span>
                <select value={siteFilter} onChange={event => setSiteFilter(event.target.value)}>
                  <option value="all">All sites</option>
                  {data.sites.map(site => (
                    <option key={site.id} value={String(site.id)}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Equipment</span>
                <select value={equipmentFilter} onChange={event => setEquipmentFilter(event.target.value)}>
                  <option value="all">All equipment</option>
                  {scheduleEquipment.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Visit purpose</span>
                <select value={purposeFilter} onChange={event => setPurposeFilter(event.target.value)}>
                  <option value="all">All purposes</option>
                  {Object.entries(PURPOSE).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Appointment status</span>
                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  {Object.entries(APPOINTMENT_STATUS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <p className="sc-results" role="status" aria-live="polite">
            Showing {visibleAppointments.length} of {appointments.length} visits · All times are Saudi time (UTC+3)
          </p>

          {dueWithoutVisit.length > 0 && (
            <section className="sc-block sc-block--flush" aria-labelledby="sc-due">
              <div className="sc-section-title">
                <h2 id="sc-due">Maintenance due, no visit scheduled</h2>
                <span className="sc-count">{dueWithoutVisit.length}</span>
              </div>
              <p className="sc-note">A due date is a maintenance target. It is not a confirmed appointment.</p>
              <ul className="sc-due-list">
                {dueWithoutVisit.map(coverage => {
                  const equipment = equipmentById.get(coverage.equipment_id)
                  const overdue = coverage.next_service_due_date < today
                  return (
                    <li key={coverage.id}>
                      <WarningCircleIcon size={20} aria-hidden="true" />
                      <div>
                        <strong>{equipment.name}</strong>
                        <p className="sc-muted">{dueNote(coverage)}</p>
                      </div>
                      <Badge status={overdue ? 'accent' : 'planned'}>
                        {overdue ? 'Overdue' : `Due ${fmtShort(coverage.next_service_due_date)}`}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {!appointments.length ? (
            <Message icon={CalendarBlankIcon} title="No visits scheduled">
              When our team schedules an inspection, maintenance or repair visit, it will appear here.
            </Message>
          ) : !visibleAppointments.length ? (
            <Message
              title={view === 'upcoming' ? 'No upcoming visits match' : 'No matching visits'}
              action={
                <button type="button" className="sc-message-button" onClick={clearScheduleFilters}>
                  Clear filters
                </button>
              }
            >
              Try another view or change your filters.
            </Message>
          ) : (
            <div className="sc-list">
              {visibleAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  equipment={equipmentById.get(appointment.equipment_id)}
                  site={siteById.get(appointment.site_id)}
                  request={latestRequest(appointment.id)}
                  eligible={isEligible(appointment)}
                  handlers={handlers}
                  onReschedule={() => setRescheduleId(appointment.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------------- Reschedule requests ---------------- */}
      {tab === 'requests' && (
        <section id="sc-panel-requests" role="tabpanel" aria-labelledby="sc-tab-requests" className="sc-panel">
          {data.is_demo && (
            <label className="sc-preview-toggle">
              <input
                type="checkbox"
                checked={alternativeOn}
                disabled={!canTogglePreview}
                onChange={event => togglePreview(event.target.checked)}
              />
              <span>
                Preview scenario: show <strong>Alternative proposed</strong> (11 Nov) for 1045A instead of Pending
              </span>
            </label>
          )}

          {!sortedRequests.length ? (
            <Message icon={ArrowsClockwiseIcon} title="No reschedule requests">
              Use Request reschedule on an upcoming visit if you need a different date.
            </Message>
          ) : (
            <div className="sc-table-wrap">
              <table className="sc-table sc-table--wide">
                <thead>
                  <tr>
                    <th scope="col">Equipment / job</th>
                    <th scope="col">Original appointment</th>
                    <th scope="col">Requested date</th>
                    <th scope="col">Reason</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Status</th>
                    <th scope="col">Response</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRequests.map(request => {
                    const appointment = appointments.find(a => a.id === request.appointment_id)
                    const open = OPEN_REQUEST.includes(request.status)
                    return (
                      <tr key={request.id}>
                        <th scope="row">
                          {equipmentById.get(request.equipment_id)?.name}
                          <small>Job {request.reference}</small>
                        </th>
                        <td>
                          {request.original_start
                            ? `${fmtDate(request.original_start)}, ${fmtTime(request.original_start)}`
                            : fmtDate(request.original_date)}
                        </td>
                        <td>{fmtDate(request.requested_date)}</td>
                        <td>{request.reason || 'Not recorded'}</td>
                        <td>{fmtDate(request.submitted_at)}</td>
                        <td>
                          <Badge status={request.status}>{REQUEST_STATUS[request.status]}</Badge>
                        </td>
                        <td>
                          {request.responded_at && <small>Responded {fmtDate(request.responded_at)}</small>}
                          {request.status === 'pending' && appointment && (
                            <span>
                              The appointment remains {dateTimeLabel(appointment.scheduled_start, appointment.scheduled_end)}.
                            </span>
                          )}
                          {request.status === 'alternative_proposed' && (
                            <span>
                              <strong>Alternative: {fmtDate(request.alternative_date)}.</strong> {request.alternative_note}
                              {request.customer_response === 'accepted_alternative' &&
                                ' You accepted this date. Our team still needs to confirm the exact time.'}
                            </span>
                          )}
                          {request.notes && <span>{request.notes}</span>}
                          {request.confirmed_start && (
                            <small>Confirmed: {dateTimeLabel(request.confirmed_start, request.confirmed_end)}</small>
                          )}
                        </td>
                        <td>
                          {open ? (
                            <div className="sc-cell-actions">
                              {request.status === 'alternative_proposed' && !request.customer_response && (
                                <button
                                  className="sc-action sc-action--solid"
                                  type="button"
                                  onClick={() => acceptAlternative(request)}
                                >
                                  Accept {fmtShort(request.alternative_date)}
                                </button>
                              )}
                              {data.is_demo && request.customer_response === 'accepted_alternative' && (
                                <button className="sc-action" type="button" onClick={() => demoConfirm(request)}>
                                  Demo: team confirms {fmtShort(request.alternative_date)}, 10:00–11:00
                                </button>
                              )}
                              <button className="sc-action" type="button" onClick={() => withdraw(request)}>
                                Withdraw request
                              </button>
                            </div>
                          ) : (
                            <span className="sc-muted">No action</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ---------------- Dialogs ---------------- */}
      <Modal open={Boolean(contractToShow)} onClose={() => setOpenContract(null)} labelledBy={undefined}>
        {contractToShow && (
          <ContractDetail
            contract={contractToShow}
            rows={rowsFor(contractToShow.id)}
            onClose={() => setOpenContract(null)}
            handlers={handlers}
          />
        )}
      </Modal>

      <Modal open={Boolean(rescheduleAppointment)} onClose={() => setRescheduleId(null)} labelledBy={undefined}>
        {rescheduleAppointment && (
          <RescheduleForm
            appointment={rescheduleAppointment}
            equipment={equipmentById.get(rescheduleAppointment.equipment_id)}
            site={siteById.get(rescheduleAppointment.site_id)}
            minDate={minDate}
            today={today}
            onSubmit={addRequest}
            onClose={() => setRescheduleId(null)}
          />
        )}
      </Modal>
    </>
  )
}

// =========================================================
// AMC & SERVICE SCHEDULE PAGE
// =========================================================

export default function AmcSchedulePage({
  data = MAINTENANCE_PREVIEW_DATA,
  loading = false,
  error = '',
  onOpenEquipment,
  onOpenServiceHistory,
  onOpenAppointment,
  onOpenService,
  onOpenCompletion,
}) {
  const navigate = useNavigate()
  const { theme = 'light' } = useOutletContext() ?? {}

  const ready = !loading && !error && Boolean(data)

  // Buttons work out of the box. Pass your own handlers to open exact records.
  const handlers = {
    onOpenEquipment: onOpenEquipment ?? (() => navigate('/equipment')),
    onOpenServiceHistory: onOpenServiceHistory ?? (() => navigate('/equipment')),
    onOpenAppointment: onOpenAppointment ?? (() => navigate('/maintenance')),
    onOpenService: onOpenService ?? (() => navigate('/services')),
    onOpenCompletion: onOpenCompletion ?? (() => navigate('/services')),
  }

  return (
    <div className="sc-page" data-theme={theme}>
      <div className="sc-main">
        <main className="sc-content" id="schedule-content" tabIndex={-1} aria-busy={loading}>
          <div className="sc-heading">
            <h1>AMC &amp; service schedule</h1>
            <p>View your maintenance coverage, upcoming visits and reschedule requests.</p>
          </div>

          {loading && (
            <div className="sc-message" role="status">
              Loading your schedule…
            </div>
          )}

          {error && (
            <div className="sc-message" role="alert">
              Could not load your schedule. Please refresh and try again.
            </div>
          )}

          {!loading && !error && !data && (
            <Message icon={TruckIcon} title="Schedule data is not connected yet">
              Your contracts and visits will appear here once the customer schedule API is connected.
            </Message>
          )}

          {ready && <ScheduleContent data={data} handlers={handlers} />}

          <footer className="sc-footer">
            <span>Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Contact support</a>
          </footer>
        </main>
      </div>
    </div>
  )
}