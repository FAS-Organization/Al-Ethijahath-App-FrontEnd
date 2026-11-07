import { useEffect, useId, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  UserIcon,
  WarningCircleIcon,
  WrenchIcon,
  XIcon,
} from '@phosphor-icons/react'

import CustomerNavbar from '../components/CustomerNavbar'
import { SERVICES_PREVIEW_DATA } from '../data/servicesPreviewData'
import './ServicesPage.css'

// =========================================================
// FRONTEND DATA CONTRACT
//
// data = {
//   company_name: string,
//   jobs: [
//     {
//       id,                       // ServiceJob id (the Job ID)
//       job_type,                 // 'amc' | 'service' | 'general'
//       status,                   // ServiceJob status
//       description,
//       requested_date,
//       site: { id, name, region: { id, name } },
//       site_address_snapshot,
//
//       machines: [               // JobEquipment
//         {
//           id, suffix, reference,
//           status,               // JobEquipment status
//           reported_issue, planned_work,
//           started_at, completed_at, estimated_completion,
//           technician_name,      // name only, never contact details
//           equipment: { id, equipment_type, brand, model_name,
//                        serial_number, customer_asset_number },
//
//           next_appointment: null | {
//             id, purpose, status, scheduled_start, scheduled_end,
//             can_reschedule,
//             reschedule: null | { status, proposed_date, alternative_date }
//           },
//
//           pending_actions: [    // things the CUSTOMER must decide
//             { id, type, label, detail }
//           ],
//           documents: [          // published customer documents only
//             { id, document_type, document_number, status }
//           ],
//           updates: [            // customer-visible ServiceUpdate rows,
//             { id, status, message, event_at }   // newest first
//           ],
//         }
//       ]
//     }
//   ]
// }
//
// The API must return only jobs of the signed-in company, and only
// updates and documents approved for customer visibility.
// This page expects the complete collection, not one API page.
// =========================================================

const THEME_KEY = 'ethijahath-dashboard-theme'

const JOB_TYPES = {
  amc: 'AMC',
  service: 'Service',
  general: 'General',
}

const JOB_STATUSES = {
  enquiry: 'Request received',
  open: 'Open',
  in_progress: 'In progress',
  completed: 'Work completed',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

const MACHINE_STATUSES = {
  not_started: 'Not started',
  inspection: 'Inspection',
  awaiting_approval: 'Awaiting your approval',
  quotation: 'Quotation',
  quotation_approved: 'Quotation approved',
  scheduled: 'Scheduled',
  awaiting_parts: 'Awaiting parts',
  in_progress: 'In progress',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STEPS = [
  'Received',
  'Inspection',
  'Quotation',
  'Scheduled',
  'Repair',
  'Completed',
]

const STEP_INDEX = {
  not_started: 0,
  inspection: 1,
  awaiting_approval: 1,
  quotation: 2,
  quotation_approved: 3,
  scheduled: 3,
  awaiting_parts: 4,
  in_progress: 4,
  on_hold: 4,
  completed: 5,
}

const WAIT_NOTES = {
  awaiting_approval: 'Waiting for your approval before we continue.',
  awaiting_parts: 'Waiting for spare parts to arrive.',
  on_hold: 'This service is on hold. Our team will update you soon.',
}

const VISIT_PURPOSES = {
  inspection: 'Inspection visit',
  maintenance: 'Maintenance visit',
  repair: 'Repair visit',
}

const RESCHEDULE_NOTES = {
  pending: 'Reschedule requested. Waiting for our team to reply.',
  alternative: 'We suggested another date for this visit.',
}

const APPROVAL_LINKS = {
  quotation: '/quotations',
}

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'action', label: 'Needs your action' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All jobs' },
]

const ACTIVE_JOB_STATUSES = ['enquiry', 'open', 'in_progress']

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

function formatVisit(appointment) {
  const start = new Date(appointment.scheduled_start)
  const end = new Date(appointment.scheduled_end)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Time not recorded'
  }

  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(start)

  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return `${day}, ${time.format(start)} to ${time.format(end)}`
}

function machineTitle(equipment = {}) {
  const name = [equipment.brand, equipment.equipment_type]
    .filter(Boolean)
    .join(' ')

  return name || 'Equipment'
}

function needsAction(job) {
  return job.machines.some(machine => machine.pending_actions?.length)
}

function isActiveJob(job) {
  return ACTIVE_JOB_STATUSES.includes(job.status)
}

function lastActivity(job) {
  const stamps = job.machines
    .flatMap(machine => machine.updates || [])
    .map(update => new Date(update.event_at).getTime())
    .filter(Number.isFinite)

  if (stamps.length) return Math.max(...stamps)

  const requested = new Date(job.requested_date).getTime()

  return Number.isFinite(requested) ? requested : 0
}

function statusTone(status) {
  if (status === 'completed' || status === 'closed') return 'green'
  if (status === 'cancelled') return 'muted'

  return 'accent'
}

function Fact({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {value === null || value === undefined || value === ''
          ? 'Not recorded'
          : value}
      </dd>
    </div>
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
      <ArrowRightIcon size={16} aria-hidden="true" />
    </button>
  )
}

function Progress({ status }) {
  if (status === 'cancelled') {
    return <p className="sv-cancelled">This service was cancelled.</p>
  }

  const current = STEP_INDEX[status]

  if (current === undefined) return null

  const finished = status === 'completed'

  return (
    <ol className="sv-steps" aria-label="Service progress">
      {STEPS.map((label, index) => {
        const state =
          finished || index < current
            ? 'done'
            : index === current
              ? 'current'
              : 'todo'

        return (
          <li
            key={label}
            className={`sv-step sv-step--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="sv-step-dot" aria-hidden="true">
              {state === 'done' ? <CheckIcon size={12} weight="bold" /> : index + 1}
            </span>
            <span className="sv-step-label">
              {label}
              <span className="sv-sr">
                {state === 'done'
                  ? ' (done)'
                  : state === 'current'
                    ? ' (current step)'
                    : ''}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function PendingAction({ action, machine, onOpenApproval }) {
  const to = APPROVAL_LINKS[action.type]

  return (
    <div className="sv-attention" role="group" aria-label="Action needed">
      <WarningCircleIcon size={22} aria-hidden="true" />

      <div>
        <strong>{action.label}</strong>
        {action.detail && <p>{action.detail}</p>}
      </div>

      {to ? (
        <Link className="sv-action sv-action--solid" to={to}>
          Review
          <ArrowRightIcon size={16} aria-hidden="true" />
        </Link>
      ) : (
        <button
          className="sv-action sv-action--solid"
          type="button"
          disabled={!onOpenApproval}
          title={
            !onOpenApproval
              ? 'Approvals are not connected yet.'
              : undefined
          }
          onClick={() => onOpenApproval?.(action, machine)}
        >
          Review
          <ArrowRightIcon size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function Visit({ machine, onRequestReschedule }) {
  const appointment = machine.next_appointment

  if (!appointment) return null

  const request = appointment.reschedule
  const open =
    request && ['pending', 'alternative'].includes(request.status)

  return (
    <div className="sv-visit">
      <span className="sv-visit-icon">
        <CalendarBlankIcon size={21} aria-hidden="true" />
      </span>

      <div className="sv-visit-text">
        <strong>
          {VISIT_PURPOSES[appointment.purpose] || 'Visit'} ·{' '}
          {appointment.status === 'confirmed' ? 'Confirmed' : 'Planned'}
        </strong>
        <p>{formatVisit(appointment)}</p>

        {open && (
          <p className="sv-visit-note">
            {RESCHEDULE_NOTES[request.status]}
            {request.status === 'pending' && request.proposed_date
              ? ` You asked for ${formatDate(request.proposed_date)}.`
              : ''}
            {request.status === 'alternative' && request.alternative_date
              ? ` Suggested date: ${formatDate(request.alternative_date)}.`
              : ''}
          </p>
        )}
      </div>

      {appointment.can_reschedule && !open && (
        <ActionButton
          available={Boolean(onRequestReschedule)}
          title="Rescheduling is not connected yet."
          onClick={() => onRequestReschedule?.(machine, appointment)}
        >
          Request reschedule
        </ActionButton>
      )}
    </div>
  )
}

function Machine({
  machine,
  onRequestReschedule,
  onOpenDocument,
  onOpenApproval,
}) {
  const [showTimeline, setShowTimeline] = useState(false)
  const timelineId = useId()

  const equipment = machine.equipment || {}
  const updates = machine.updates || []
  const latest = updates[0]
  const documents = machine.documents || []
  const actions = machine.pending_actions || []
  const waitNote = WAIT_NOTES[machine.status]
  const completed = machine.status === 'completed'

  return (
    <section className="sv-machine" aria-label={machineTitle(equipment)}>
      <div className="sv-machine-heading">
        <div className="sv-machine-title">
          <h3>
            {machineTitle(equipment)}
            {equipment.model_name ? ` ${equipment.model_name}` : ''}
          </h3>
          <p>
            <span>{machine.reference}</span>
            {equipment.customer_asset_number && (
              <span> · Asset {equipment.customer_asset_number}</span>
            )}
            {equipment.serial_number && (
              <span> · S/N {equipment.serial_number}</span>
            )}
          </p>
        </div>

        <span
          className={`sv-badge sv-badge--${statusTone(machine.status)}`}
        >
          {MACHINE_STATUSES[machine.status] || 'Status unavailable'}
        </span>
      </div>

      {actions.map(action => (
        <PendingAction
          key={action.id}
          action={action}
          machine={machine}
          onOpenApproval={onOpenApproval}
        />
      ))}

      <Progress status={machine.status} />

      {waitNote && !actions.length && (
        <p className="sv-wait">
          <ClockIcon size={16} aria-hidden="true" />
          {waitNote}
        </p>
      )}

      <dl className="sv-facts">
        <Fact label="Reported issue" value={machine.reported_issue} />
        <Fact label="Planned work" value={machine.planned_work} />
        <Fact label="Started" value={formatDate(machine.started_at)} />
        <Fact
          label={completed ? 'Completed' : 'Estimated completion'}
          value={formatDate(
            completed ? machine.completed_at : machine.estimated_completion
          )}
        />
      </dl>

      {machine.technician_name && (
        <p className="sv-technician">
          <UserIcon size={16} aria-hidden="true" />
          Technician: <strong>{machine.technician_name}</strong>
        </p>
      )}

      <Visit machine={machine} onRequestReschedule={onRequestReschedule} />

      {latest && (
        <div className="sv-latest">
          <span className="sv-latest-label">Latest update</span>
          <p>{latest.message}</p>
          <time dateTime={latest.event_at}>
            {formatDate(latest.event_at, true)}
          </time>
        </div>
      )}

      {updates.length > 1 && (
        <>
          <button
            className="sv-toggle"
            type="button"
            aria-expanded={showTimeline}
            aria-controls={timelineId}
            onClick={() => setShowTimeline(value => !value)}
          >
            {showTimeline
              ? 'Hide history'
              : `Show full history (${updates.length} updates)`}
            <CaretDownIcon size={16} aria-hidden="true" />
          </button>

          <ol
            className="sv-timeline"
            id={timelineId}
            hidden={!showTimeline}
          >
            {updates.map(update => (
              <li key={update.id}>
                <time dateTime={update.event_at}>
                  {formatDate(update.event_at, true)}
                </time>
                <strong>
                  {MACHINE_STATUSES[update.status] || 'Update'}
                </strong>
                <p>{update.message}</p>
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="sv-record-actions">
        {documents.map(document => (
          <ActionButton
            key={document.id}
            available={
              document.status === 'ready' && Boolean(onOpenDocument)
            }
            title="This document is not connected yet."
            onClick={() => onOpenDocument?.(document)}
          >
            <FileTextIcon size={16} aria-hidden="true" />
            {document.document_type === 'inspection'
              ? 'Inspection report'
              : document.document_type === 'completion'
                ? 'Completion card'
                : document.document_number || 'Document'}
          </ActionButton>
        ))}
      </div>

      {!documents.length && (
        <p className="sv-note">No documents published for this service yet.</p>
      )}
    </section>
  )
}

function JobCard(props) {
  const { job } = props
  const action = needsAction(job)

  return (
    <article className="sv-card">
      <header className="sv-card-header">
        <div className="sv-card-title">
          <h2>Job {job.id}</h2>
          <p className="sv-card-meta">
            <span className="sv-card-meta-item">
              <MapPinIcon size={15} aria-hidden="true" />
              {job.site?.name}
              {job.site?.region ? ` · ${job.site.region.name}` : ''}
            </span>
            <span className="sv-card-meta-item">
              <CalendarBlankIcon size={15} aria-hidden="true" />
              Requested {formatDate(job.requested_date)}
            </span>
          </p>
        </div>

        <div className="sv-card-badges">
          <span className="sv-badge sv-badge--muted">
            {JOB_TYPES[job.job_type] || 'Job'}
          </span>

          {action && (
            <span className="sv-badge sv-badge--alert">Action needed</span>
          )}

          <span className={`sv-badge sv-badge--${statusTone(job.status)}`}>
            {JOB_STATUSES[job.status] || 'Status unavailable'}
          </span>
        </div>
      </header>

      <p className="sv-description">{job.description}</p>

      <div className="sv-machines">
        {job.machines.map(machine => (
          <Machine
            key={machine.id}
            machine={machine}
            onRequestReschedule={props.onRequestReschedule}
            onOpenDocument={props.onOpenDocument}
            onOpenApproval={props.onOpenApproval}
          />
        ))}
      </div>
    </article>
  )
}
function todayValue() {
  const now = new Date()
  const pad = number => String(number).padStart(2, '0')

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function RequestDialog({ options, isDemo, onSubmit, onClose }) {
  const dialogRef = useRef(null)
  const sites = options?.sites || []
  const allEquipment = options?.equipment || []

  const [siteId, setSiteId] = useState(
    sites.length === 1 ? String(sites[0].id) : ''
  )
  const [equipmentIds, setEquipmentIds] = useState([])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('form')
  const [failure, setFailure] = useState('')

  const sending = phase === 'sending'
  const siteEquipment = allEquipment.filter(
    item => String(item.site_id) === siteId
  )

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  function chooseSite(value) {
    setSiteId(value)
    setEquipmentIds([])
    setErrors(old => ({ ...old, site: '', equipment: '' }))
  }

  function toggleEquipment(id) {
    setEquipmentIds(old =>
      old.includes(id) ? old.filter(item => item !== id) : [...old, id]
    )
    setErrors(old => ({ ...old, equipment: '' }))
  }

  function closeDialog() {
    if (!sending) dialogRef.current?.close()
  }

  async function submit(event) {
    event.preventDefault()

    if (sending) return

    const next = {}

    if (!siteId) next.site = 'Select the site where the equipment is.'

    if (siteEquipment.length && !equipmentIds.length) {
      next.equipment = 'Select at least one machine.'
    }

    if (description.trim().length < 10) {
      next.description = 'Describe the problem in at least 10 characters.'
    }

    if (date && date < todayValue()) {
      next.date = 'Choose today or a later date.'
    }

    setErrors(next)
    setFailure('')

    const first = Object.keys(next)[0]

    if (first) {
      dialogRef.current
        ?.querySelector(`[data-field="${first}"]`)
        ?.focus()
      return
    }

    const payload = {
      site_id: Number(siteId),
      equipment_ids: equipmentIds,
      description: description.trim(),
      preferred_date: date || null,
    }

    setPhase('sending')

    try {
      if (onSubmit) {
        await onSubmit(payload)
      } else if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 700))
      } else {
        throw new Error('Service requests are not connected yet.')
      }

      setPhase('done')
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : 'Could not send your request. Please try again.'
      )
      setPhase('form')
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="sv-dialog"
      aria-labelledby="sv-request-title"
      onClose={onClose}
      onCancel={event => {
        if (sending) event.preventDefault()
      }}
      onClick={event => {
        if (event.target === event.currentTarget) closeDialog()
      }}
    >
      <div className="sv-dialog-header">
        <div>
          <h2 id="sv-request-title">Request a service</h2>
          <p>Tell us what is wrong and our team will take it from there.</p>
        </div>

        <button
          className="sv-close"
          type="button"
          aria-label="Close"
          disabled={sending}
          onClick={closeDialog}
        >
          <XIcon size={20} aria-hidden="true" />
        </button>
      </div>

      {phase === 'done' ? (
        <div className="sv-dialog-done" role="status">
          <CheckCircleIcon size={44} weight="fill" aria-hidden="true" />
          <h3>Request sent</h3>
          <p>
            We received your request and will confirm it shortly. You can
            follow it on this page once it is accepted.
          </p>
          {isDemo && !onSubmit && (
            <p className="sv-dialog-demo">
              Preview mode: nothing was actually sent.
            </p>
          )}
          <button className="sv-primary" type="button" onClick={closeDialog}>
            Done
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} aria-busy={sending}>
          <div className="sv-dialog-scroll">
            <div className="sv-field">
              <label htmlFor="sv-site">Site</label>
              <select
                id="sv-site"
                data-field="site"
                value={siteId}
                disabled={sending}
                aria-invalid={Boolean(errors.site)}
                onChange={event => chooseSite(event.target.value)}
              >
                <option value="">Select a site</option>
                {sites.map(item => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name} · {item.region.name}
                  </option>
                ))}
              </select>
              {errors.site && <p className="sv-error">{errors.site}</p>}
            </div>

            {siteId && (
              <fieldset className="sv-field sv-machines-field">
                <legend>Which machines need service?</legend>

                {siteEquipment.length ? (
                  <div className="sv-checks">
                    {siteEquipment.map((item, index) => (
                      <label className="sv-check" key={item.id}>
                        <input
                          type="checkbox"
                          data-field={index === 0 ? 'equipment' : undefined}
                          checked={equipmentIds.includes(item.id)}
                          disabled={sending}
                          onChange={() => toggleEquipment(item.id)}
                        />
                        <span>
                          {item.label}
                          {item.asset && <small>Asset {item.asset}</small>}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="sv-hint">
                    No equipment is recorded for this site yet. Describe the
                    machine below and our team will link it.
                  </p>
                )}

                {errors.equipment && (
                  <p className="sv-error">{errors.equipment}</p>
                )}
              </fieldset>
            )}

            <div className="sv-field">
              <label htmlFor="sv-description">What is the problem?</label>
              <textarea
                id="sv-description"
                data-field="description"
                rows={4}
                maxLength={1000}
                value={description}
                disabled={sending}
                placeholder="For example: oil is leaking near the lifting assembly."
                aria-invalid={Boolean(errors.description)}
                onChange={event => {
                  setDescription(event.target.value)
                  setErrors(old => ({ ...old, description: '' }))
                }}
              />
              {errors.description && (
                <p className="sv-error">{errors.description}</p>
              )}
            </div>

            <div className="sv-field">
              <label htmlFor="sv-date">
                Preferred date <span>(optional)</span>
              </label>
              <input
                id="sv-date"
                data-field="date"
                type="date"
                min={todayValue()}
                value={date}
                disabled={sending}
                aria-invalid={Boolean(errors.date)}
                onChange={event => {
                  setDate(event.target.value)
                  setErrors(old => ({ ...old, date: '' }))
                }}
              />
              <p className="sv-hint">
                We will confirm the final date after reviewing your request.
              </p>
              {errors.date && <p className="sv-error">{errors.date}</p>}
            </div>

            {failure && (
              <p className="sv-error sv-error--box" role="alert">
                {failure}
              </p>
            )}
          </div>

          <div className="sv-dialog-footer">
            <button
              className="sv-secondary"
              type="button"
              disabled={sending}
              onClick={closeDialog}
            >
              Cancel
            </button>

            <button className="sv-primary" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
export default function ServicesPage({
  data = SERVICES_PREVIEW_DATA,
  loading = false,
  error = '',
  onRequestService,
  onRequestReschedule,
  onOpenDocument,
  onOpenApproval,
}) {
  const [searchParams] = useSearchParams()
  const initialServiceReference = searchParams.get('service') || ''

  const [theme, setTheme] = useState(initialTheme)
  const [tab, setTab] = useState(
    initialServiceReference ? 'all' : 'active',
  )
  const [query, setQuery] = useState(initialServiceReference)
  const [site, setSite] = useState('all')
  const [type, setType] = useState('all')
  const [requestOpen, setRequestOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // The page remains usable without storage.
    }
  }, [theme])

  const ready = !loading && !error && Boolean(data)
  const jobs = ready ? data.jobs : []

  const sites = Array.from(
    new Map(jobs.map(job => [String(job.site.id), job.site])).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const counts = {
    active: jobs.filter(isActiveJob).length,
    action: jobs.filter(needsAction).length,
    completed: jobs.filter(
      job => job.status === 'completed' || job.status === 'closed'
    ).length,
    all: jobs.length,
  }

  const upcomingVisits = jobs
    .filter(isActiveJob)
    .flatMap(job => job.machines)
    .filter(machine => machine.next_appointment).length

  const visible = jobs
    .filter(job => {
      const matchesTab =
        tab === 'all' ||
        (tab === 'active' && isActiveJob(job)) ||
        (tab === 'action' && needsAction(job)) ||
        (tab === 'completed' &&
          (job.status === 'completed' || job.status === 'closed'))

      const searchText = [
        job.id,
        job.description,
        job.site.name,
        job.site.region?.name,
        ...job.machines.flatMap(machine => [
          machine.reference,
          machine.reported_issue,
          machine.equipment?.brand,
          machine.equipment?.equipment_type,
          machine.equipment?.model_name,
          machine.equipment?.serial_number,
          machine.equipment?.customer_asset_number,
        ]),
      ]
        .join(' ')
        .toLowerCase()

      return (
        matchesTab &&
        searchText.includes(query.trim().toLowerCase()) &&
        (site === 'all' || String(job.site.id) === site) &&
        (type === 'all' || job.job_type === type)
      )
    })
    .sort((a, b) => lastActivity(b) - lastActivity(a))

  function clearFilters() {
    setQuery('')
    setSite('all')
    setType('all')
    setTab('active')
  }

  return (
    <div className="sv-page" data-theme={theme}>


      <CustomerNavbar
        companyName="Demo Customer Company"
        customerName="Customer account"
        unreadCount={2}
        theme={theme}
      />

      <div className="sv-main">
        <header className="sv-topbar">
          <span>
            Customer portal / <strong>Service jobs</strong>
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
          id="services-content"
          tabIndex={-1}
          aria-busy={loading}
        >
          <div className="sv-heading">
            <div>
              <h1>Every job, in one place.</h1>
              <p>
                Follow each service from first request to completion, see
                upcoming visits and act on anything waiting for you.
              </p>
            </div>

            <button
              className="sv-primary"
              type="button"
              disabled={!ready}
              onClick={() => setRequestOpen(true)}
            >
              <PlusIcon size={18} aria-hidden="true" />
              Request a service
            </button>
          </div>

          {loading && (
            <div className="sv-message" role="status">
              Loading your service jobs…
            </div>
          )}

          {error && (
            <div className="sv-message" role="alert">
              Could not load your service jobs. Please refresh and try again.
            </div>
          )}

          {!loading && !error && !data && (
            <div className="sv-message">
              <WrenchIcon size={32} aria-hidden="true" />
              <h2>Service data is not connected yet</h2>
              <p>
                Your service jobs will appear here once the customer
                service API is connected.
              </p>
            </div>
          )}

          {ready && (
            <>
              {data.is_demo && (
                <p className="sv-demo-notice">
                  Preview mode · Fictional service jobs. No live backend
                  connection.
                </p>
              )}

              <section className="sv-summary" aria-label="Service summary">
                {[
                  {
                    label: 'Active jobs',
                    value: counts.active,
                    icon: WrenchIcon,
                  },
                  {
                    label: 'Need your action',
                    value: counts.action,
                    icon: WarningCircleIcon,
                    alert: counts.action > 0,
                  },
                  {
                    label: 'Upcoming visits',
                    value: upcomingVisits,
                    icon: CalendarBlankIcon,
                  },
                  {
                    label: 'Completed',
                    value: counts.completed,
                    icon: CheckCircleIcon,
                  },
                ].map(({ label, value, icon: Icon, alert }) => (
                  <div
                    className={`sv-summary-item${alert ? ' sv-summary-item--alert' : ''}`}
                    key={label}
                  >
                    <span className="sv-summary-icon">
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <div>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  </div>
                ))}
              </section>

              {counts.action > 0 && tab !== 'action' && (
                <div className="sv-banner" role="status">
                  <WarningCircleIcon size={22} aria-hidden="true" />
                  <p>
                    {counts.action === 1
                      ? '1 job is waiting for your decision.'
                      : `${counts.action} jobs are waiting for your decision.`}
                  </p>
                  <button type="button" onClick={() => setTab('action')}>
                    Show them
                  </button>
                </div>
              )}

              <div className="sv-tabs" role="group" aria-label="Job filter">
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
                  <span className="sv-sr">Search service jobs</span>
                  <MagnifyingGlassIcon size={20} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search job number, equipment or issue"
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

                  <label>
                    <span>Job type</span>
                    <select
                      value={type}
                      onChange={event => setType(event.target.value)}
                    >
                      <option value="all">All types</option>
                      {Object.entries(JOB_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <p className="sv-results" role="status" aria-live="polite">
                Showing {visible.length} of {jobs.length} jobs
              </p>

              {!jobs.length ? (
                <div className="sv-message">
                  <WrenchIcon size={32} aria-hidden="true" />
                  <h2>No service jobs yet</h2>
                  <p>
                    When you request a service or an AMC visit is planned,
                    it will appear here with live progress.
                  </p>
                  <a href="mailto:info@alethijahath.com">Contact support</a>
                </div>
              ) : !visible.length ? (
                <div className="sv-message">
                  <h2>No matching jobs</h2>
                  <p>Try a different search or change your filters.</p>
                  <button type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="sv-list">
                  {visible.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onRequestReschedule={onRequestReschedule}
                      onOpenDocument={onOpenDocument}
                      onOpenApproval={onOpenApproval}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <footer className="sv-footer">
            <span>Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Contact support</a>
          </footer>
        </main>
          {requestOpen && ready && (
          <RequestDialog
            options={data.request_options}
            isDemo={Boolean(data.is_demo)}
            onSubmit={onRequestService}
            onClose={() => setRequestOpen(false)}
          />
          )}
      </div>
    </div>
  )
}