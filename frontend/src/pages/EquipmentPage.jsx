import { useEffect, useId, useRef, useState } from 'react'
import {
  ArrowRightIcon,
  BuildingsIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  TruckIcon,
  WrenchIcon,
  XIcon,
} from '@phosphor-icons/react'

import CustomerNavbar from '../components/CustomerNavbar'
import './EquipmentPage.css'

// =========================================================
// FRONTEND DATA CONTRACT
//
// data = {
//   company_name: string,
//   equipment: [
//     {
//       id,
//       equipment_type,
//       brand,
//       model_name,
//       serial_number,
//       customer_asset_number,
//       fuel_type,
//       capacity,
//       manufacture_year,
//       is_retired,
//
//       current_site: {
//         id,
//         name,
//         address,
//         region: { id, name }
//       },
//
//       current_amc_coverages: [
//         {
//           id,
//           start_date,
//           end_date,
//           next_service_due_date,
//           contract: { contract_number }
//         }
//       ],
//
//       service_records: [
//         {
//           id,
//           status,
//           reported_issue,
//           planned_work,
//           started_at,
//           completed_at,
//           estimated_completion,
//           job: { id }
//         }
//       ]
//     }
//   ]
// }
//
// Equipment fields come from Equipment.
// current_site comes from CustomerSite and Region.
// service_records comes from JobEquipment.
//
// current_amc_coverages is a DERIVED SERIALIZER FIELD:
// Django must return only currently effective coverage,
// checking both coverage and contract status/date ranges.
//
// Return only records belonging to the signed-in company.
// Service information must be approved for customer visibility.
// This page expects the complete collection, not one API page.
// =========================================================

const SERVICE_STATUSES = {
  not_started: 'Not started',
  inspection: 'Inspection',
  awaiting_approval: 'Awaiting approval',
  quotation: 'Quotation',
  quotation_approved: 'Quotation approved',
  scheduled: 'Scheduled',
  awaiting_parts: 'Awaiting parts',
  in_progress: 'In progress',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function initialTheme() {
  try {
    const saved = localStorage.getItem('ethijahath-dashboard-theme')

    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // Theme persistence is optional.
  }

  return 'light'
}

function formatDate(value) {
  if (!value) return 'Not recorded'

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

function equipmentTitle(item) {
  return [item.brand, item.equipment_type].filter(Boolean).join(' ')
}

function isActiveService(record) {
  return (
    Object.hasOwn(SERVICE_STATUSES, record.status) &&
    record.status !== 'completed' &&
    record.status !== 'cancelled'
  )
}

function Specification({ label, value }) {
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

function ActionButton({ children, available, onClick }) {
  return (
    <button
      className="eq-action"
      type="button"
      disabled={!available}
      title={!available ? 'This destination is not connected yet.' : undefined}
      onClick={onClick}
    >
      {children}
      <ArrowRightIcon size={16} aria-hidden="true" />
    </button>
  )
}

function ServiceRecord({
  record,
  onOpenService,
  onOpenDocument,
}) {
  const completed = record.status === 'completed'
  const snapshot = record.equipment_snapshot || {}

  const historicalName = [
    snapshot.brand,
    snapshot.equipment_type,
  ].filter(Boolean).join(' ')

  const reference = record.job?.id != null && record.suffix
    ? `${record.job.id}${record.suffix}`
    : record.job?.id != null
      ? `Job ${record.job.id}`
      : 'Reference not recorded'

  const jobTypes = {
    amc: 'AMC',
    service: 'Service',
    general: 'General',
  }

  // Proposed customer serializer field, not a new database field.
  // The API must return only customer-authorized, published documents.
  const documents = record.customer_documents || []

  return (
    <article className="eq-service-record">
      <div className="eq-service-heading">
        <div>
          <strong>{reference}</strong>
          <p className="eq-muted">
            {jobTypes[record.job?.job_type] || 'Job type not recorded'}
          </p>
        </div>

        <span className={`eq-badge ${completed ? 'eq-badge--green' : ''}`}>
          {SERVICE_STATUSES[record.status] || 'Status unavailable'}
        </span>
      </div>

      <p className="eq-history-description">
        {record.reported_issue || 'No reported issue recorded.'}
      </p>

      <dl className="eq-specifications eq-history-facts">
        <Specification
          label="Started"
          value={formatDate(record.started_at)}
        />

        <Specification
          label={completed ? 'Completed' : 'Estimated completion'}
          value={formatDate(
            completed
              ? record.completed_at
              : record.estimated_completion
          )}
        />

        <Specification
          label="Site/address at service"
          value={record.job?.site_address_snapshot}
        />

        <Specification
          label="Equipment recorded at service"
          value={historicalName}
        />
      </dl>

      <div className="eq-record-actions">
        <ActionButton
          available={Boolean(onOpenService)}
          onClick={() => onOpenService?.(record)}
        >
          View service
        </ActionButton>

        {documents.map(document => (
          <ActionButton
            key={document.id}
            available={
              document.status === 'ready' &&
              Boolean(onOpenDocument)
            }
            onClick={() => onOpenDocument?.(document)}
          >
            {document.document_type === 'inspection'
              ? 'Inspection PDF'
              : document.document_type === 'completion'
                ? 'Completion PDF'
                : document.document_number || 'View document'}
          </ActionButton>
        ))}
      </div>

      {!documents.length && (
        <p className="eq-record-note">
          No published inspection or completion PDFs supplied.
        </p>
      )}
    </article>
  )
}

// =========================================================
// EQUIPMENT CARD AND DETAILS DIALOG
// =========================================================

function EquipmentCard({
  item,
  onOpenService,
  onOpenCoverage,
  onOpenAppointment,
  onOpenDocument,
  onRequestService,
}) {
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const titleId = useId()
  const [open, setOpen] = useState(false)

  const coverage = item.current_amc_coverages || []
  const records = item.service_records || []
  const active = records.filter(isActiveService)

  const completed = records
    .filter(record => record.status === 'completed')
    .sort(
      (a, b) =>
        new Date(b.completed_at || 0) -
        new Date(a.completed_at || 0)
    )

  const cancelled = records.filter(
    record => record.status === 'cancelled'
  )

  const dueDates = coverage
    .map(record => record.next_service_due_date)
    .filter(Boolean)
    .sort()

  const appointments = records
    .flatMap(record =>
      (record.appointments || []).map(appointment => ({
        ...appointment,
        serviceRecord: record,
      }))
    )
    .filter(appointment =>
      ['planned', 'confirmed'].includes(appointment.status)
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_start) -
        new Date(b.scheduled_start)
    )

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function openDetails() {
    const dialog = dialogRef.current

    if (!dialog || dialog.open) return

    dialog.showModal()
    setOpen(true)
  }

  function closeDetails() {
    dialogRef.current?.close()
  }

  function finishClosing() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function closeFromBackdrop(event) {
    if (event.target !== event.currentTarget) return

    const bounds = event.currentTarget.getBoundingClientRect()

    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom

    if (outside) closeDetails()
  }

  function followAction(callback, value) {
    if (!callback) return

    closeDetails()
    callback(value)
  }

  function renderRecord(record) {
    return (
      <ServiceRecord
        key={record.id}
        record={record}
        onOpenService={
          onOpenService
            ? value => followAction(onOpenService, value)
            : undefined
        }
        onOpenDocument={
          onOpenDocument
            ? value => followAction(onOpenDocument, value)
            : undefined
        }
      />
    )
  }

  return (
    <article className="eq-card">
      <div className="eq-card-header">
        <span className="eq-machine-icon">
          <TruckIcon size={27} aria-hidden="true" />
        </span>

        <div className="eq-card-title">
          <h2>{equipmentTitle(item)}</h2>

          <p>
            {item.customer_asset_number
              ? `Asset ${item.customer_asset_number}`
              : `Equipment #${item.id}`}
          </p>
        </div>

        <span className="eq-badge eq-badge--muted">
          {item.is_retired ? 'Retired' : 'Current record'}
        </span>
      </div>

      <div className="eq-location">
        <BuildingsIcon size={18} aria-hidden="true" />

        <span>
          {item.current_site.name}
          <small>{item.current_site.region.name}</small>
        </span>
      </div>

      <dl className="eq-card-identifiers">
        <Specification label="Model" value={item.model_name} />
        <Specification label="Serial number" value={item.serial_number} />
      </dl>

      <div className="eq-coverage-strip">
        <span
          className={`eq-badge ${
            coverage.length ? 'eq-badge--green' : 'eq-badge--muted'
          }`}
        >
          {coverage.length ? 'AMC covered' : 'No current AMC'}
        </span>

        <span
          className={`eq-service-count ${
            active.length ? 'eq-service-count--active' : ''
          }`}
        >
          <WrenchIcon size={16} aria-hidden="true" />
          {active.length} active {active.length === 1 ? 'service' : 'services'}
        </span>
      </div>

      <div className="eq-card-dates">
        <div>
          <span>Last completed service</span>
          <strong>
            {completed.length
              ? formatDate(completed[0].completed_at)
              : 'No recorded completion'}
          </strong>
        </div>

        <div>
          <span>Next AMC service due</span>
          <strong>
            {dueDates.length
              ? formatDate(dueDates[0])
              : coverage.length
                ? 'Due date not recorded'
                : 'No current AMC'}
          </strong>
        </div>
      </div>

      <button
        ref={triggerRef}
        className="eq-details-trigger"
        type="button"
        aria-haspopup="dialog"
        onClick={openDetails}
      >
        <span>Details & service history</span>
        <ArrowRightIcon size={18} aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        className="eq-dialog"
        aria-labelledby={titleId}
        onClose={finishClosing}
        onClick={closeFromBackdrop}
      >
        <header className="eq-dialog-header">
          <div>
            <h2 id={titleId}>{equipmentTitle(item)}</h2>
            <p>
              {item.customer_asset_number || `Equipment #${item.id}`}
              {' · '}
              {item.current_site.name}
            </p>
          </div>

          <button
            className="eq-close"
            type="button"
            aria-label="Close equipment details"
            onClick={closeDetails}
          >
            <XIcon size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="eq-dialog-scroll">
          <section className="eq-dialog-overview">
            <div className="eq-photo">
              <TruckIcon size={48} aria-hidden="true" />

              {item.photo ? (
                <img
                  src={item.photo}
                  alt={equipmentTitle(item)}
                  loading="lazy"
                  onError={event => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <span>No equipment photo recorded</span>
              )}
            </div>

            <div>
              <div className="eq-dialog-badges">
                <span className="eq-badge eq-badge--muted">
                  {item.is_retired ? 'Retired equipment' : 'Current equipment record'}
                </span>

                <span
                  className={`eq-badge ${
                    coverage.length ? 'eq-badge--green' : 'eq-badge--muted'
                  }`}
                >
                  {coverage.length ? 'Current AMC coverage' : 'No current AMC'}
                </span>
              </div>

              <dl className="eq-specifications">
                <Specification label="Current site" value={item.current_site.name} />
                <Specification label="Region" value={item.current_site.region.name} />
                <Specification label="Current address" value={item.current_site.address} />
                <Specification label="Active services" value={active.length} />
              </dl>
            </div>
          </section>

          <section className="eq-dialog-section">
            <div className="eq-section-title">
              <h3>Equipment specifications</h3>
            </div>

            <dl className="eq-specifications eq-specifications--three">
              <Specification label="Type" value={item.equipment_type} />
              <Specification label="Brand" value={item.brand} />
              <Specification label="Model" value={item.model_name} />
              <Specification label="Serial number" value={item.serial_number} />
              <Specification
                label="Customer asset number"
                value={item.customer_asset_number}
              />
              <Specification label="Fuel type" value={item.fuel_type} />
              <Specification label="Capacity" value={item.capacity} />
              <Specification
                label="Manufacture year"
                value={item.manufacture_year}
              />
            </dl>
          </section>

          <section className="eq-dialog-section">
            <div className="eq-section-title">
              <h3>Current AMC coverage</h3>
              <span className="eq-section-count">{coverage.length}</span>
            </div>

            {!coverage.length ? (
              <p className="eq-muted">
                No currently effective AMC coverage is recorded.
              </p>
            ) : coverage.map(record => {
              const interval =
                record.interval_months_override ??
                record.contract?.service_interval_months

              return (
                <div className="eq-contract" key={record.id}>
                  <strong>{record.contract?.contract_number}</strong>

                  <dl className="eq-specifications">
                    <Specification
                      label="Coverage dates"
                      value={`${formatDate(record.start_date)} – ${formatDate(record.end_date)}`}
                    />

                    <Specification
                      label="Service interval"
                      value={
                        interval
                          ? `Every ${interval} ${interval === 1 ? 'month' : 'months'}`
                          : null
                      }
                    />

                    <Specification
                      label="Next service due"
                      value={
                        record.next_service_due_date
                          ? formatDate(record.next_service_due_date)
                          : 'Due date not recorded'
                      }
                    />
                  </dl>

                  <ActionButton
                    available={Boolean(onOpenCoverage)}
                    onClick={() => followAction(onOpenCoverage, record)}
                  >
                    View contract & coverage
                  </ActionButton>
                </div>
              )
            })}
          </section>

          <section className="eq-dialog-section">
            <div className="eq-section-title">
              <h3>Scheduled visits</h3>
              <CalendarBlankIcon size={19} aria-hidden="true" />
            </div>

            {!appointments.length ? (
              <p className="eq-muted">
                No planned or confirmed visits supplied.
                An AMC due date does not confirm a visit.
              </p>
            ) : appointments.map(appointment => (
              <div className="eq-visit" key={appointment.id}>
                <div>
                  <strong>
                    {appointment.purpose
                      ? appointment.purpose.charAt(0).toUpperCase() +
                        appointment.purpose.slice(1)
                      : 'Service visit'}
                  </strong>

                  <p>
                    {formatDate(appointment.scheduled_start)}
                    {' · '}
                    {appointment.status}
                  </p>
                </div>

                <ActionButton
                  available={Boolean(onOpenAppointment)}
                  onClick={() =>
                    followAction(onOpenAppointment, appointment)
                  }
                >
                  View visit
                </ActionButton>
              </div>
            ))}
          </section>

          <section className="eq-dialog-section">
            <div className="eq-section-title">
              <h3>Active services</h3>
              <span className="eq-section-count">{active.length}</span>
            </div>

            {!active.length ? (
              <p className="eq-muted">
                No active service records for this equipment.
              </p>
            ) : active.map(renderRecord)}
          </section>

          <section className="eq-dialog-section">
            <div className="eq-section-title">
              <h3>Completed service history</h3>
              <span className="eq-section-count">{completed.length}</span>
            </div>

            {!completed.length ? (
              <p className="eq-muted">
                No recorded completed service history.
              </p>
            ) : completed.map(renderRecord)}
          </section>

          {cancelled.length > 0 && (
            <section className="eq-dialog-section">
              <div className="eq-section-title">
                <h3>Cancelled services</h3>
                <span className="eq-section-count">{cancelled.length}</span>
              </div>

              {cancelled.map(renderRecord)}
            </section>
          )}
        </div>

        <footer className="eq-dialog-footer">
          <p>Service progress and final reports belong to each service record.</p>

          <ActionButton
            available={Boolean(onRequestService) && !item.is_retired}
            onClick={() => followAction(onRequestService, item)}
          >
            Request service
          </ActionButton>
        </footer>
      </dialog>
    </article>
  )
}

// =========================================================
// MY EQUIPMENT PAGE
// =========================================================

export default function EquipmentPage({
  data = null,
  loading = false,
  error = '',
  onSignOut,
  onOpenService,
  onOpenCoverage,
  onOpenAppointment,
  onOpenDocument,
  onRequestService,
}) {

  const [theme, setTheme] = useState(initialTheme)
  const [query, setQuery] = useState('')
  const [site, setSite] = useState('all')
  const [coverageFilter, setCoverageFilter] = useState('all')
  const [recordFilter, setRecordFilter] = useState('current')
  const [activityFilter, setActivityFilter] = useState('all')

  useEffect(() => {
    try {
      localStorage.setItem('ethijahath-dashboard-theme', theme)
    } catch {
      // The page remains usable without storage.
    }
  }, [theme])

  const ready = !loading && !error && Boolean(data)
  const equipment = ready ? data.equipment : []

  const sites = Array.from(
    new Map(
      equipment.map(item => [
        String(item.current_site.id),
        item.current_site,
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name))



  const current = equipment.filter(item => !item.is_retired)

  const covered = current.filter(
    item => item.current_amc_coverages.length > 0
  ).length

  const beingServiced = current.filter(
    item => item.service_records.some(isActiveService)
  ).length

  const visible = equipment.filter(item => {
    const searchText = [
      item.id,
      item.equipment_type,
      item.brand,
      item.model_name,
      item.serial_number,
      item.customer_asset_number,
      item.current_site.name,
      item.current_site.region.name,
    ].join(' ').toLowerCase()

    const matchesQuery = searchText.includes(query.trim().toLowerCase())
    const matchesSite =
      site === 'all' || String(item.current_site.id) === site

    const hasCoverage = item.current_amc_coverages.length > 0

    const matchesCoverage =
      coverageFilter === 'all' ||
      (coverageFilter === 'covered' && hasCoverage) ||
      (coverageFilter === 'uncovered' && !hasCoverage)

    const matchesRecord =
      recordFilter === 'all' ||
      (recordFilter === 'current' && !item.is_retired) ||
      (recordFilter === 'retired' && item.is_retired)



    const hasActiveService = item.service_records.some(isActiveService)

    const matchesActivity =
      activityFilter === 'all' ||
      (activityFilter === 'active' && hasActiveService) ||
      (activityFilter === 'none' && !hasActiveService)

    return (
      matchesQuery &&
      matchesSite &&
      matchesCoverage &&
      matchesRecord &&
      matchesActivity
    )
  })

  function clearFilters() {
    setQuery('')
    setSite('all')
    setCoverageFilter('all')
    setRecordFilter('current')
    setActivityFilter('all')
  }

  return (
    <div className="eq-page" data-theme={theme}>
      <a className="eq-skip" href="#equipment-content">
        Skip to equipment
      </a>

      <CustomerNavbar
        companyName="Demo Customer Company"
        customerName="Customer account"
        unreadCount={2}
        theme={theme}
      />

      <div className="eq-main">
        <header className="eq-topbar">
          <span>Customer portal / <strong>My equipment</strong></span>

          <button
            className="eq-theme-button"
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={() =>
              setTheme(value => value === 'light' ? 'dark' : 'light')
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
          className="eq-content"
          id="equipment-content"
          tabIndex={-1}
          aria-busy={loading}
        >
          <div className="eq-heading">
            <h1>Know your equipment.</h1>
            <p>
              View equipment details, AMC coverage and service history
              across your sites.
            </p>
          </div>

          {loading && (
            <div className="eq-message" role="status">
              Loading your equipment…
            </div>
          )}

          {error && (
            <div className="eq-message" role="alert">
              Could not load your equipment. Please refresh and try again.
            </div>
          )}

          {!loading && !error && !data && (
            <div className="eq-message">
              <TruckIcon size={32} aria-hidden="true" />
              <h2>Equipment data is not connected yet</h2>
              <p>
                Your equipment records will appear here once the
                customer equipment API is connected.
              </p>
            </div>
          )}

          {ready && (
            <>
              {data.is_demo && (
                <p className="eq-demo-notice">
                  Preview mode · Fictional equipment records.
                  No live backend connection.
                </p>
              )}
              <section className="eq-summary" aria-label="Equipment summary">
                {[
                  {
                    label: 'Current equipment',
                    value: current.length,
                    icon: TruckIcon,
                  },
                  {
                    label: 'AMC covered',
                    value: covered,
                    icon: CheckCircleIcon,
                  },
                  {
                    label: 'With active services',
                    value: beingServiced,
                    icon: WrenchIcon,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div className="eq-summary-item" key={label}>
                    <span className="eq-summary-icon">
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <div>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  </div>
                ))}
              </section>

              <div className="eq-toolbar">
                <label className="eq-search">
                  <span className="eq-sr">Search equipment</span>
                  <MagnifyingGlassIcon size={20} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search equipment, serial number or site"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                </label>

                <div className="eq-filters">


                  <label>
                    <span>Service activity</span>
                    <select
                      value={activityFilter}
                      onChange={event => setActivityFilter(event.target.value)}
                    >
                      <option value="all">All service activity</option>
                      <option value="active">With active services</option>
                      <option value="none">Without active services</option>
                    </select>
                  </label>
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
                    <span>AMC coverage</span>
                    <select
                      value={coverageFilter}
                      onChange={event => setCoverageFilter(event.target.value)}
                    >
                      <option value="all">All coverage</option>
                      <option value="covered">Currently covered</option>
                      <option value="uncovered">No current AMC</option>
                    </select>
                  </label>

                  <label>
                    <span>Equipment records</span>
                    <select
                      value={recordFilter}
                      onChange={event => setRecordFilter(event.target.value)}
                    >
                      <option value="current">Current equipment</option>
                      <option value="retired">Retired equipment</option>
                      <option value="all">All equipment</option>
                    </select>
                  </label>
                </div>
              </div>

              <p className="eq-results" role="status" aria-live="polite">
                Showing {visible.length} of {equipment.length} equipment records
              </p>

              {!equipment.length ? (
                <div className="eq-message">
                  <TruckIcon size={32} aria-hidden="true" />
                  <h2>No equipment recorded yet</h2>
                  <p>
                    Contact our team if your equipment should already
                    be linked to this account.
                  </p>
                  <a href="mailto:info@alethijahath.com">Contact support</a>
                </div>
              ) : !visible.length ? (
                <div className="eq-message">
                  <h2>No matching equipment</h2>
                  <p>Try a different search or change your filters.</p>
                  <button type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="eq-grid">
                  {visible.map(item => (
                    <EquipmentCard
                      key={item.id}
                      item={item}
                      onOpenService={onOpenService}
                      onOpenCoverage={onOpenCoverage}
                      onOpenAppointment={onOpenAppointment}
                      onOpenDocument={onOpenDocument}
                      onRequestService={onRequestService}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <footer className="eq-footer">
            <span>Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Contact support</a>
          </footer>
        </main>
      </div>
    </div>
  )
}