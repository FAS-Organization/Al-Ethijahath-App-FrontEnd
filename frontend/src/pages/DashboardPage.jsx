import { useEffect, useRef, useState } from 'react'
import CustomerNavbar from '../components/CustomerNavbar'
import {
  SquaresFourIcon,
  TruckIcon,
  WrenchIcon,
  ReceiptIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  ArrowUpRightIcon,
  ArrowRightIcon,
  LightningIcon,
  HeadsetIcon,
  XIcon,
  CheckCircleIcon,
  CalendarBlankIcon,
} from '@phosphor-icons/react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import './DashboardPage.css'

const equipment = [
  {
    id: 'EQ-001',
    name: 'Toyota forklift',
    model: '8FG25 · 2.5 tonne',
    site: 'Riyadh warehouse',
    status: 'In service',
    coverage: 'AMC',
    next: '12 Nov 2026',
    job: 'JOB-1042',
    description:
      'Hydraulic leak inspection is underway. The technician is checking hose connections and seals.',
    steps: ['Request received', 'Technician assigned', 'Inspection underway'],
  },
  {
    id: 'EQ-002',
    name: 'Perkins generator',
    model: '1104A · 100 kVA',
    site: 'Riyadh warehouse',
    status: 'Operational',
    coverage: 'AMC',
    next: '16 Nov 2026',
    job: 'JOB-1038',
    description:
      'Preventive maintenance completed. Oil, filters and electrical connections were inspected.',
    steps: ['Inspection completed', 'Service completed', 'Equipment operational'],
  },
  {
    id: 'EQ-003',
    name: 'Electric shutter',
    model: 'Industrial roller door',
    site: 'Jeddah facility',
    status: 'Attention needed',
    coverage: 'Non-AMC',
    next: '10 Nov 2026',
    job: 'JOB-1045',
    description:
      'Intermittent opening reported. A diagnostic visit is scheduled to inspect the controller and safety sensors.',
    steps: ['Issue reported', 'Visit scheduled'],
  },
  {
    id: 'EQ-004',
    name: 'Hyster forklift',
    model: 'H3.0FT · 3 tonne',
    site: 'Dammam depot',
    status: 'Operational',
    coverage: 'AMC',
    next: '21 Nov 2026',
    job: 'JOB-1029',
    description:
      'The last maintenance visit is complete. The next scheduled visit includes brake and battery checks.',
    steps: ['Service completed', 'Report issued', 'Next visit scheduled'],
  },
]

const history = [
  { month: 'Jun', completed: 4 },
  { month: 'Jul', completed: 7 },
  { month: 'Aug', completed: 5 },
  { month: 'Sep', completed: 9 },
  { month: 'Oct', completed: 7 },
  { month: 'Nov', completed: 11 },
]

const invoices = [
  { id: 'INV-2084', item: 'Forklift maintenance', total: 4200, paid: 2000 },
  { id: 'INV-2079', item: 'Generator service', total: 1850, paid: 1850 },
  { id: 'INV-2072', item: 'Annual maintenance contract', total: 6800, paid: 3400 },
]

const initialNotifications = [
  { id: 1, title: 'Inspection in progress', text: 'Toyota forklift · JOB-1042', read: false },
  { id: 2, title: 'Upcoming maintenance', text: 'Electric shutter · 10 Nov 2026', read: false },
  { id: 3, title: 'Payment recorded', text: 'SAR 2,000 received against INV-2084', read: true },
]


const money = value =>
  new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(value)

function initialTheme() {
  try {
    const saved = localStorage.getItem('ethijahath-dashboard-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage may be unavailable in private or restricted environments.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function Badge({ status }) {
  const variant =
    status === 'Operational' || status === 'Paid'
      ? 'success'
      : status === 'Attention needed' || status === 'Partial payment'
        ? 'warning'
        : 'neutral'

  return <span className={`ed-badge ed-badge--${variant}`}>{status}</span>
}

function PanelHeading({ title, subtitle, children }) {
  return (
    <div className="ed-panel-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="ed-tooltip">
      <strong>{label || payload[0].name}</strong>
      <span>{payload[0].value} services completed</span>
    </div>
  )
}

function DetailsDialog({ item, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    dialog.showModal()

    return () => {
      dialog.close()
      previousFocus?.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="ed-dialog"
      aria-labelledby="ed-detail-title"
      onCancel={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="ed-dialog-content">
        <div className="ed-row">
          <span className="ed-muted">{item.id} / {item.job}</span>
          <button
            className="ed-icon-button"
            onClick={onClose}
            aria-label="Close equipment details"
            autoFocus
          >
            <XIcon size={20} />
          </button>
        </div>

        <h2 id="ed-detail-title">{item.name}</h2>
        <p className="ed-muted">{item.model} · {item.site}</p>
        <Badge status={item.status} />

        <p className="ed-detail-description">{item.description}</p>

        <h3>Latest service activity</h3>
        <ol className="ed-timeline">
          {item.steps.map(step => (
            <li key={step}>
              <CheckCircleIcon size={19} aria-hidden="true" />
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="ed-detail-footer">
          <CalendarBlankIcon size={21} aria-hidden="true" />
          <div>
            <span className="ed-muted">Next scheduled visit</span>
            <strong>{item.next}</strong>
          </div>
        </div>

        <a
          className="ed-button ed-button--primary"
          href={`mailto:info@alethijahath.com?subject=${encodeURIComponent(
            `Reschedule request: ${item.id}`
          )}&body=${encodeURIComponent(
            `Hello, I would like to request a new service date for ${item.name} (${item.id}).\n\nPreferred date:\nReason:\n`
          )}`}
        >
          Request reschedule by email
          <ArrowUpRightIcon size={18} />
        </a>
      </div>
    </dialog>
  )
}

export default function DashboardPage() {
  const [theme, setTheme] = useState(initialTheme)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All equipment')
  const [period, setPeriod] = useState('6')
  const [selected, setSelected] = useState(null)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)
  const bellRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem('ethijahath-dashboard-theme', theme)
    } catch {
      // Theme still works when persistence is unavailable.
    }
  }, [theme])

  useEffect(() => {
    if (!showNotifications) return

    function dismiss(event) {
      if (!notificationRef.current?.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    function escape(event) {
      if (event.key === 'Escape') {
        setShowNotifications(false)
        bellRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)

    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [showNotifications])

  const unread = notifications.filter(item => !item.read).length
  const outstanding = invoices.reduce(
    (total, invoice) => total + invoice.total - invoice.paid,
    0
  )
  const covered = equipment.filter(item => item.coverage === 'AMC').length
  const chartData = history.slice(-Number(period))
  const completed = chartData.reduce((total, item) => total + item.completed, 0)

  const visibleEquipment = equipment.filter(item => {
    const matchesSearch = `${item.name} ${item.id} ${item.site}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())

    return (
      matchesSearch &&
      (filter === 'All equipment' || item.status === filter)
    )
  })

    function navigate(target) {
    document.getElementById(target)?.scrollIntoView({ block: 'start' })
    }

  return (
    <div className="ed-dashboard" data-theme={theme}>
      <a className="ed-skip-link" href="#overview">Skip to dashboard</a>

      <CustomerNavbar theme={theme} />

      <div className="ed-main">
        <header className="ed-topbar">
          <div className="ed-breadcrumb">
            Client portal <span>/</span> <strong>Dashboard</strong>
          </div>

          <div className="ed-top-actions">
            <a
              className="ed-dispatch"
              href="https://www.alethijahath.com/#dispatch-form"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LightningIcon size={17} weight="fill" aria-hidden="true" />
              <span>Emergency dispatch</span>
              <ArrowUpRightIcon size={15} aria-hidden="true" />
            </a>

            <button
              className="ed-icon-button"
              onClick={() => setTheme(old => old === 'light' ? 'dark' : 'light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <MoonIcon size={21} /> : <SunIcon size={21} />}
            </button>

            <div className="ed-notification-wrap" ref={notificationRef}>
              <button
                ref={bellRef}
                className="ed-icon-button"
                onClick={() => setShowNotifications(old => !old)}
                aria-label={`Notifications, ${unread} unread`}
                aria-expanded={showNotifications}
                aria-controls="ed-notifications"
              >
                <BellIcon size={21} />
                {unread > 0 && <span className="ed-notification-dot" />}
              </button>

              {showNotifications && (
                <section
                  className="ed-notifications"
                  id="ed-notifications"
                  aria-label="Notifications"
                >
                  <div className="ed-row">
                    <strong>Notifications</strong>
                    <button
                      className="ed-text-button"
                      disabled={!unread}
                      onClick={() => setNotifications(old =>
                        old.map(item => ({ ...item, read: true }))
                      )}
                    >
                      Mark all read
                    </button>
                  </div>
                  {notifications.map(item => (
                    <article key={item.id} className={item.read ? '' : 'is-unread'}>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </article>
                  ))}
                </section>
              )}
            </div>
          </div>
        </header>

        <main className="ed-content" id="overview">
          <div className="ed-page-heading">
            <div>
              <div className="ed-eyebrow">YOUR OPERATIONS, AT A GLANCE</div>
              <h1>Everything in good hands.</h1>
              <p>Equipment, service updates and payments. All in one place.</p>
            </div>
            <span className="ed-demo-label">Demo data · Nov 2026</span>
          </div>

          <section className="ed-metrics" aria-label="Account summary">
            {[
              { label: 'Total equipment', value: equipment.length, note: 'Across 3 sites', icon: TruckIcon, target: 'equipment' },
              { label: 'Active service', value: '1', note: 'Inspection in progress', icon: WrenchIcon, target: 'services' },
              { label: 'Scheduled visits', value: '4', note: 'Next: 10 November', icon: CalendarBlankIcon, target: 'services' },
              { label: 'Outstanding balance', value: money(outstanding), note: '2 partially paid invoices', icon: ReceiptIcon, target: 'invoices' },
            ].map(({ label, value, note, icon: Icon, target }, index) => (
              <button
                className="ed-metric"
                key={label}
                style={{ '--ed-order': index }}
                onClick={() => navigate(target)}
              >
                <span className="ed-metric-label">
                  {label}<Icon size={20} aria-hidden="true" />
                </span>
                <strong>{value}</strong>
                <span className="ed-metric-note">
                  {note}<ArrowUpRightIcon size={16} aria-hidden="true" />
                </span>
              </button>
            ))}
          </section>

          <div className="ed-chart-grid">
            <section className="ed-panel">
              <PanelHeading
                title="Service activity"
                subtitle="Completed maintenance and repair visits"
              >
                <select
                  aria-label="Service activity period"
                  value={period}
                  onChange={event => setPeriod(event.target.value)}
                >
                  <option value="6">Last 6 months</option>
                  <option value="3">Last 3 months</option>
                </select>
              </PanelHeading>

              <div className="ed-chart-summary">
                <strong>{completed}</strong>
                <span>completed services</span>
              </div>

              <div
                className="ed-area-chart"
                role="img"
                aria-label={chartData.map(item =>
                  `${item.month}: ${item.completed} completed services`
                ).join(', ')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ed-service-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--ed-accent)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--ed-accent)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--ed-line)" strokeDasharray="4 5" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--ed-muted)', fontSize: 12 }} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--ed-muted)', fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="var(--ed-accent)"
                      strokeWidth={2.5}
                      fill="url(#ed-service-fill)"
                      animationDuration={1100}
                      activeDot={{ r: 6, strokeWidth: 3, stroke: 'var(--ed-surface)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="ed-panel">
              <PanelHeading title="AMC coverage" subtitle="Your equipment protection" />

              <div
                className="ed-donut"
                role="img"
                aria-label={`${covered} of ${equipment.length} equipment covered by AMC`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'AMC covered', value: covered },
                        { name: 'Non-AMC', value: equipment.length - covered },
                      ]}
                      dataKey="value"
                      innerRadius={68}
                      outerRadius={86}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={4}
                      stroke="none"
                      animationDuration={1000}
                    >
                      <Cell fill="var(--ed-accent)" />
                      <Cell fill="var(--ed-track)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="ed-donut-label">
                  <strong>{Math.round(covered / equipment.length * 100)}%</strong>
                  <span>covered</span>
                </div>
              </div>

              <div className="ed-coverage-legend">
                <span><i /> AMC covered <strong>{covered}</strong></span>
                <span><i /> Non-AMC <strong>{equipment.length - covered}</strong></span>
              </div>

              <a className="ed-inline-link" href="mailto:info@alethijahath.com?subject=AMC%20coverage%20enquiry">
                Discuss your coverage <ArrowRightIcon size={17} />
              </a>
            </section>
          </div>

          <section className="ed-panel ed-equipment-panel" id="equipment">
            <PanelHeading title="Your equipment" subtitle="A clear view of every machine and its next service">
              <span className="ed-count">{equipment.length} equipment</span>
            </PanelHeading>

            <div className="ed-table-toolbar">
              <label className="ed-search">
                <MagnifyingGlassIcon size={19} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search equipment, ID or site..."
                  aria-label="Search equipment"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                />
              </label>
              <select
                aria-label="Filter equipment by status"
                value={filter}
                onChange={event => setFilter(event.target.value)}
              >
                <option>All equipment</option>
                <option>Operational</option>
                <option>In service</option>
                <option>Attention needed</option>
              </select>
            </div>

            <div className="ed-table-scroll" tabIndex={0} aria-label="Equipment table">
              <table>
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Coverage</th>
                    <th>Next service</th>
                    <th><span className="ed-sr-only">Details</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEquipment.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="ed-equipment-name">
                          <span className="ed-equipment-icon"><TruckIcon size={21} /></span>
                          <div><strong>{item.name}</strong><small>{item.id} · {item.model}</small></div>
                        </div>
                      </td>
                      <td>{item.site}</td>
                      <td><Badge status={item.status} /></td>
                      <td><span className="ed-coverage">{item.coverage}</span></td>
                      <td>{item.next}</td>
                      <td>
                        <button
                          className="ed-icon-button"
                          aria-label={`View ${item.name} details`}
                          onClick={() => setSelected(item)}
                        >
                          <ArrowUpRightIcon size={19} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!visibleEquipment.length && (
              <div className="ed-empty" role="status">
                <MagnifyingGlassIcon size={28} />
                <strong>No matching equipment</strong>
                <p>Try another name, site or status.</p>
                <button className="ed-text-button" onClick={() => {
                  setQuery('')
                  setFilter('All equipment')
                }}>
                  Clear filters
                </button>
              </div>
            )}
          </section>

          <div className="ed-bottom-grid">
            <section className="ed-panel" id="services">
              <PanelHeading title="Upcoming visits" subtitle="Plan ahead with your service schedule" />

              {[...equipment]
                .sort((a, b) => parseInt(a.next) - parseInt(b.next))
                .slice(0, 3)
                .map(item => (
                  <button className="ed-visit" key={item.id} onClick={() => setSelected(item)}>
                    <span className="ed-date">
                      <small>NOV</small>
                      <strong>{item.next.split(' ')[0]}</strong>
                    </span>
                    <span className="ed-visit-copy">
                      <strong>{item.name}</strong>
                      <span>{item.site}</span>
                    </span>
                    <ArrowRightIcon size={19} aria-hidden="true" />
                  </button>
                ))}
            </section>

            <section className="ed-panel" id="invoices">
              <PanelHeading title="Recent invoices" subtitle="Payments and remaining balances" />

              {invoices.map(invoice => {
                const remaining = invoice.total - invoice.paid

                return (
                  <article className="ed-invoice" key={invoice.id}>
                    <div className="ed-row">
                      <strong>{invoice.id}</strong>
                      <strong>{money(invoice.total)}</strong>
                    </div>
                    <p>{invoice.item}</p>
                    <div className="ed-row">
                      <Badge status={remaining ? 'Partial payment' : 'Paid'} />
                      <span className="ed-invoice-balance">
                        {remaining ? `${money(remaining)} remaining` : 'Fully settled'}
                      </span>
                    </div>
                  </article>
                )
              })}
            </section>
          </div>

          <footer className="ed-footer">
            <span>© {new Date().getFullYear()} Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Need assistance? Contact support</a>
          </footer>
        </main>
      </div>

      {selected && (
        <DetailsDialog item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}