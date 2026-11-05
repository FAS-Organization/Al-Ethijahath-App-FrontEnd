import { useEffect, useState } from 'react'
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

function ServiceRecord({ record }) {
  const completed = record.status === 'completed'

  return (
    <article className="eq-service-record">
      <div className="eq-service-heading">
        <strong>Service job #{record.job.id}</strong>

        <span className={`eq-badge ${completed ? 'eq-badge--green' : ''}`}>
          {SERVICE_STATUSES[record.status] || 'Status unavailable'}
        </span>
      </div>

      <dl className="eq-specifications">
        <Specification
          label="Reported issue"
          value={record.reported_issue}
        />
        <Specification
          label="Planned work"
          value={record.planned_work}
        />
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
      </dl>
    </article>
  )
}

// =========================================================
// EQUIPMENT CARD
// =========================================================

function EquipmentCard({ item }) {
  const coverage = item.current_amc_coverages
  const records = item.service_records

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

        <span
          className={`eq-badge ${
            item.is_retired ? 'eq-badge--muted' : 'eq-badge--green'
          }`}
        >
          {item.is_retired ? 'Retired' : 'In your equipment list'}
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

        <span className="eq-service-count">
          <WrenchIcon size={16} aria-hidden="true" />
          {active.length} active {active.length === 1 ? 'service' : 'services'}
        </span>
      </div>

      <div className="eq-next-service">
        <CalendarBlankIcon size={19} aria-hidden="true" />
        <div>
          <span>Next AMC service due</span>
          <strong>
            {dueDates.length
              ? formatDate(dueDates[0])
              : coverage.length
                ? 'Not scheduled'
                : 'No current AMC coverage'}
          </strong>
        </div>
      </div>

      <details className="eq-details">
        <summary>
          <span>Details & service history</span>
          <ArrowRightIcon size={18} aria-hidden="true" />
        </summary>

        <div className="eq-details-body">
          <section>
            <h3>Equipment specifications</h3>

            <dl className="eq-specifications">
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
              <Specification
                label="Site address"
                value={item.current_site.address}
              />
            </dl>
          </section>

          <section>
            <h3>Current AMC coverage</h3>

            {!coverage.length ? (
              <p className="eq-muted">
                No currently effective AMC coverage is recorded.
              </p>
            ) : coverage.map(record => (
              <div className="eq-contract" key={record.id}>
                <strong>{record.contract.contract_number}</strong>
                <p>
                  {formatDate(record.start_date)}
                  {' – '}
                  {formatDate(record.end_date)}
                </p>
                <p>
                  Next service due: {record.next_service_due_date
                    ? formatDate(record.next_service_due_date)
                    : 'Not scheduled'}
                </p>
              </div>
            ))}
          </section>

          <section>
            <h3>Active services</h3>

            {!active.length ? (
              <p className="eq-muted">
                No active service records for this equipment.
              </p>
            ) : active.map(record => (
              <ServiceRecord key={record.id} record={record} />
            ))}
          </section>

          <section>
            <h3>Completed service history</h3>

            {!completed.length ? (
              <p className="eq-muted">
                No completed service records yet.
              </p>
            ) : completed.map(record => (
              <ServiceRecord key={record.id} record={record} />
            ))}
          </section>

          {cancelled.length > 0 && (
            <section>
              <h3>Cancelled services</h3>
              {cancelled.map(record => (
                <ServiceRecord key={record.id} record={record} />
              ))}
            </section>
          )}
        </div>
      </details>
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
}) {
  const [theme, setTheme] = useState(initialTheme)
  const [query, setQuery] = useState('')
  const [site, setSite] = useState('all')
  const [coverageFilter, setCoverageFilter] = useState('all')
  const [recordFilter, setRecordFilter] = useState('current')

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

    return (
      matchesQuery &&
      matchesSite &&
      matchesCoverage &&
      matchesRecord
    )
  })

  function clearFilters() {
    setQuery('')
    setSite('all')
    setCoverageFilter('all')
    setRecordFilter('all')
  }

  return (
    <div className="eq-page" data-theme={theme}>
      <a className="eq-skip" href="#equipment-content">
        Skip to equipment
      </a>

      <CustomerNavbar
        theme={theme}
        companyName={ready ? data.company_name : undefined}
        enabledPages={['overview', 'equipment']}
        onSignOut={onSignOut}
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
                    <EquipmentCard key={item.id} item={item} />
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