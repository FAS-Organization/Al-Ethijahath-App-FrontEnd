import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  BellIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  FilePdfIcon,
  FileTextIcon,
  LightningIcon,
  MoonIcon,
  ReceiptIcon,
  SunIcon,
  TruckIcon,
  WrenchIcon,
} from '@phosphor-icons/react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import CustomerNavbar from '../components/CustomerNavbar'
import './DashboardPage.css'

// =========================================================
// DEMO DATA
// Money is stored in integer halalas: 100 halalas = SAR 1.
// Replace this frontend data structure with mapped API data.
// =========================================================

const DEMO_DATA = {
  companyName: 'Demo company',

  equipment: [
    {
      id: 'EQ-001',
      name: 'Toyota forklift',
      model: '8FG25',
      site: 'Riyadh warehouse',
      coverage: 'AMC',
      status: 'In service',
      lastService: '2026-10-12',
    },
    {
      id: 'EQ-002',
      name: 'Perkins generator',
      model: '1104A',
      site: 'Riyadh warehouse',
      coverage: 'AMC',
      status: 'Operational',
      lastService: '2026-10-16',
    },
    {
      id: 'EQ-003',
      name: 'Electric shutter',
      model: 'Industrial roller door',
      site: 'Jeddah facility',
      coverage: 'Non-AMC',
      status: 'Inspection scheduled',
      lastService: null,
    },
    {
      id: 'EQ-004',
      name: 'Hyster forklift',
      model: 'H3.0FT',
      site: 'Dammam depot',
      coverage: 'AMC',
      status: 'Operational',
      lastService: '2026-10-21',
    },
  ],

  activeJobs: [
    {
      id: 'JOB-1042',
      equipment: 'Toyota forklift',
      site: 'Riyadh warehouse',
      status: 'Awaiting approval',
      damage: 'Hydraulic hose leak detected during inspection.',
      work: 'Inspection completed. Replacement quotation issued.',
      updatedAt: '2026-11-04T09:00:00+03:00',
    },
    {
      id: 'JOB-1045',
      equipment: 'Electric shutter',
      site: 'Jeddah facility',
      status: 'Inspection scheduled',
      damage: 'Intermittent opening reported by the customer.',
      work: 'Controller and safety-sensor inspection scheduled.',
      updatedAt: '2026-11-03T14:30:00+03:00',
    },
  ],

  appointments: [
    {
      id: 'APT-1045',
      equipment: 'Electric shutter',
      site: 'Jeddah facility',
      startsAt: '2026-11-10T09:00:00+03:00',
      status: 'Confirmed',
      reschedulePending: false,
    },
    {
      id: 'APT-1046',
      equipment: 'Perkins generator',
      site: 'Riyadh warehouse',
      startsAt: '2026-11-16T10:00:00+03:00',
      status: 'Reschedule requested',
      reschedulePending: true,
    },
  ],

  quotations: [
    {
      id: 'QUO-1042',
      job: 'JOB-1042',
      title: 'Hydraulic hose replacement',
      equipment: 'Toyota forklift',
      totalMinor: 420000,
    },
  ],

  invoices: [
    {
      id: 'INV-2084',
      description: 'Completed forklift maintenance',
      totalMinor: 420000,
      paidMinor: 200000,
      balanceMinor: 220000,
      dueDate: '2026-11-02',
      overdue: true,
    },
    {
      id: 'INV-2079',
      description: 'Generator service',
      totalMinor: 185000,
      paidMinor: 185000,
      balanceMinor: 0,
      dueDate: '2026-11-10',
      overdue: false,
    },
    {
      id: 'INV-2072',
      description: 'Annual maintenance contract',
      totalMinor: 680000,
      paidMinor: 340000,
      balanceMinor: 340000,
      dueDate: '2026-11-15',
      overdue: false,
    },
  ],

  // Completed service counts, not revenue or estimated progress.
  serviceActivity: [
    { month: 'Jun', completed: 4 },
    { month: 'Jul', completed: 7 },
    { month: 'Aug', completed: 5 },
    { month: 'Sep', completed: 9 },
    { month: 'Oct', completed: 7 },
    { month: 'Nov', completed: 3 },
  ],

  documents: [
    {
      id: 'DOC-1042',
      title: 'Forklift inspection report',
      job: 'JOB-1042',
      type: 'Inspection report',
      issuedOn: '2026-11-04',
      url: null,
    },
    {
      id: 'DOC-1038',
      title: 'Generator completion card',
      job: 'JOB-1038',
      type: 'Job completion card',
      issuedOn: '2026-10-16',
      url: null,
    },
  ],

  notifications: [
    {
      id: 'N-1',
      title: 'Quotation awaiting approval',
      message: 'Review QUO-1042 for your Toyota forklift.',
      read: false,
      tone: 'warning',
    },
    {
      id: 'N-2',
      title: 'Invoice payment reminder',
      message: 'INV-2084 has an overdue remaining balance.',
      read: false,
      tone: 'warning',
    },
    {
      id: 'N-3',
      title: 'Generator service completed',
      message: 'Your job completion card has been issued.',
      read: true,
      tone: 'success',
    },
  ],
}

// =========================================================
// FORMATTERS AND SMALL COMPONENTS
// =========================================================

const money = minor =>
  new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100)

function formatDate(value, includeTime = false) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit' }
      : {}),
  }).format(new Date(value))
}

// =========================================================
// DASHBOARD MOTION
// =========================================================

function useDashboardMotion(rootRef, ready, reducedMotion) {
  useEffect(() => {
    const root = rootRef.current

    if (!root || !ready || reducedMotion) return
    if (!('IntersectionObserver' in window)) return

    const animations = new Set()

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return

          const element = entry.target

          observer.unobserve(element)

          // Keyboard navigation should never wait for a reveal.
          if (element.contains(document.activeElement)) return
          if (typeof element.animate !== 'function') return

          const isMetric = element.classList.contains('ed-metric')
          const index = isMetric
            ? Array.from(element.parentElement.children).indexOf(element)
            : 0

          const animation = element.animate(
            [
              {
                opacity: 0.25,
                translate: '0 18px',
              },
              {
                opacity: 1,
                translate: '0 0',
              },
            ],
            {
              duration: isMetric ? 560 : 460,
              delay: isMetric ? Math.min(index * 65, 195) : 0,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'backwards',
            }
          )

          animations.add(animation)

          animation.onfinish = () => {
            animations.delete(animation)
          }
        })
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -24px 0px',
      }
    )

    root
      .querySelectorAll('.ed-page-heading, .ed-metric, .ed-panel')
      .forEach(element => observer.observe(element))

    function finishOnFocus() {
      animations.forEach(animation => animation.finish())
      animations.clear()
    }

    root.addEventListener('focusin', finishOnFocus)

    return () => {
      observer.disconnect()
      root.removeEventListener('focusin', finishOnFocus)

      animations.forEach(animation => animation.cancel())
      animations.clear()
    }
  }, [rootRef, ready, reducedMotion])
}

function AnimatedValue({
  value,
  currency = false,
  suffix = '',
  reducedMotion = false,
}) {
  const elementRef = useRef(null)
  const currentValueRef = useRef(0)

  const target = Number.isFinite(value) ? value : 0

  const format = number =>
    currency
      ? money(Math.round(number))
      : `${Math.round(number).toLocaleString('en-SA')}${suffix}`

  const finalLabel = format(target)

  useEffect(() => {
    const element = elementRef.current

    if (!element) return

    let frameId = 0
    let started = false

    const formatFrame = number =>
      currency
        ? money(Math.round(number))
        : `${Math.round(number).toLocaleString('en-SA')}${suffix}`

    function showFinal() {
      element.textContent = formatFrame(target)
      currentValueRef.current = target
    }

    if (reducedMotion || !('IntersectionObserver' in window)) {
      showFinal()
      return
    }

    function start() {
      if (started) return
      started = true

      const from = currentValueRef.current
      const difference = target - from
      const duration = 850
      let startTime = null

      if (difference === 0) {
        showFinal()
        return
      }

      function tick(time) {
        if (startTime === null) startTime = time

        const progress = Math.min((time - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 4)
        const next = from + difference * eased

        currentValueRef.current = next
        element.textContent = formatFrame(next)

        if (progress < 1) {
          frameId = requestAnimationFrame(tick)
        } else {
          showFinal()
        }
      }

      frameId = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return

        observer.disconnect()
        start()
      },
      { threshold: 0.5 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [target, currency, suffix, reducedMotion])

  return (
    <span className="ed-animated-value">
      <span className="ed-sr-only">{finalLabel}</span>
      <span ref={elementRef} aria-hidden="true">
        {finalLabel}
      </span>
    </span>
  )
}

function initialTheme() {
  try {
    const saved = localStorage.getItem('ethijahath-dashboard-theme')

    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // The theme still works without browser storage.
  }

  return 'light'
}

function Status({ children, tone = 'neutral' }) {
  return (
    <span className={`ed-status ed-status--${tone}`}>
      {children}
    </span>
  )
}

function SectionHeading({ title, description, children }) {
  return (
    <div className="ed-section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {children}
    </div>
  )
}

function EmptyState({ children }) {
  return <p className="ed-empty">{children}</p>
}

function ServiceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="ed-chart-tooltip">
      <span>{label}</span>
      <strong>{payload[0].value} completed services</strong>
    </div>
  )
}

// A callback opens the real workflow. This component never
// pretends that an approval or reschedule has been saved.
function ActionButton({ children, onAction, item }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleClick() {
    if (!onAction || busy) return

    setBusy(true)
    setFailed(false)

    try {
      await onAction(item)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ed-action">
      <button
        type="button"
        className="ed-button"
        disabled={!onAction || busy}
        onClick={handleClick}
        title={
          !onAction
            ? 'Available when this workflow is connected.'
            : undefined
        }
      >
        {busy ? 'Opening…' : children}
        <ArrowUpRightIcon size={16} aria-hidden="true" />
      </button>

      {failed && (
        <p className="ed-action-error" role="alert">
          Could not open this action. Please try again.
        </p>
      )}
    </div>
  )
}

// =========================================================
// DASHBOARD PAGE
//
// API integration:
// - Pass complete customer-scoped collections.
// - activeJobs contains only active jobs.
// - appointments contains only upcoming appointments.
// - quotations contains only quotations awaiting approval.
// - Financial totals must include the same invoice collection.
// - For paginated APIs, provide server-calculated summary data
//   instead of calculating account totals from one page.
// =========================================================

export default function DashboardPage({
  data = DEMO_DATA,
  loading = false,
  error = '',
  onReviewQuotation,
  onReschedule,
  onOpenEquipment,
  onSignOut,
}) {
  const dashboardRef = useRef(null)
  const [theme, setTheme] = useState(initialTheme)
  const [period, setPeriod] = useState('6')
  const [query, setQuery] = useState('')
  const reducedMotion = false

  useEffect(() => {
    try {
      localStorage.setItem('ethijahath-dashboard-theme', theme)
    } catch {
      // Storage is optional.
    }
  }, [theme])


  const ready = !loading && !error && Boolean(data)
  useDashboardMotion(dashboardRef, ready, reducedMotion)
  const demo = data === DEMO_DATA

  const equipment = ready ? data.equipment : []
  const jobs = ready ? data.activeJobs : []
  const appointments = ready ? data.appointments : []
  const quotations = ready ? data.quotations : []
  const invoices = ready ? data.invoices : []
  const documents = ready ? data.documents : []
  const notifications = ready ? data.notifications : []

  const unread = notifications.filter(item => !item.read).length
  const covered = equipment.filter(item => item.coverage === 'AMC').length
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.balanceMinor,
    0
  )
  const paid = invoices.reduce(
    (sum, invoice) => sum + invoice.paidMinor,
    0
  )
  const overdueCount = invoices.filter(
    invoice => invoice.overdue && invoice.balanceMinor > 0
  ).length

  const chartData = ready
    ? data.serviceActivity.slice(-Number(period))
    : []

  const completed = chartData.reduce(
    (sum, item) => sum + item.completed,
    0
  )

  const paymentChart = [
    { name: 'Paid', value: paid, fill: 'var(--ed-chart-paid)' },
    {
      name: 'Outstanding',
      value: outstanding,
      fill: 'var(--ed-chart-unpaid)',
    },
  ]

  const visibleEquipment = equipment.filter(item =>
    `${item.id} ${item.name} ${item.site}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  )

  const metrics = [
    {
      label: 'Your equipment',
      value: equipment.length,
      detail: `${covered} covered by AMC`,
      icon: TruckIcon,
      href: '#equipment',
    },
    {
      label: 'Active service jobs',
      value: jobs.length,
      detail: 'Inspection and repair updates',
      icon: WrenchIcon,
      href: '#active-jobs',
    },
    {
      label: 'Upcoming visits',
      value: appointments.length,
      detail: 'Scheduled maintenance',
      icon: CalendarBlankIcon,
      href: '#maintenance',
    },
    {
      label: 'Outstanding balance',
      value: outstanding,
      currency: true,
      detail: `${overdueCount} overdue ${
        overdueCount === 1 ? 'invoice' : 'invoices'
      }`,
      icon: ReceiptIcon,
      href: '#invoices',
    },
  ]

  return (
    <div
      ref={dashboardRef}
      className="ed-dashboard"
      data-theme={theme}
    >
      <a className="ed-skip-link" href="#overview">
        Skip to dashboard
      </a>

      <CustomerNavbar
        companyName="Demo Customer Company"
        customerName="Customer account"
        unreadCount={2}
        theme={theme}
      />

      <div className="ed-main">
        {/* DASHBOARD TOPBAR */}
        <header className="ed-topbar">
          <div className="ed-breadcrumb">
            Customer portal <span>/</span> <strong>Overview</strong>
          </div>

          <div className="ed-top-actions">
            <a
              className="ed-dispatch"
              href="https://www.alethijahath.com/#dispatch-form"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LightningIcon size={17} weight="fill" aria-hidden="true" />
              Emergency dispatch
              <span className="ed-sr-only"> (opens in a new tab)</span>
            </a>

            <a
              className="ed-icon-button"
              href="#notifications"
              aria-label={`Notifications, ${unread} unread`}
            >
              <BellIcon size={21} aria-hidden="true" />
              {unread > 0 && (
                <span className="ed-notification-count">{unread}</span>
              )}
            </a>

            <button
              type="button"
              className="ed-icon-button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={() =>
                setTheme(current => current === 'light' ? 'dark' : 'light')
              }
            >
              {theme === 'light' ? (
                <MoonIcon size={21} aria-hidden="true" />
              ) : (
                <SunIcon size={21} aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        <main
          className="ed-content"
          id="overview"
          tabIndex={-1}
          aria-busy={loading}
        >
          <div className="ed-page-heading">
            <div>
              <h1>Your operations, at a glance.</h1>
              <p>
                Equipment, service updates and payments.
                Everything you need to keep moving.
              </p>
            </div>

            {ready && (
              <a className="ed-heading-link" href="#active-jobs">
                View service updates
                <ArrowDownIcon size={17} aria-hidden="true" />
              </a>
            )}
          </div>

          {demo && ready && (
            <p className="ed-demo-notice">
              <strong>Demo preview · November 2026</strong>
              <span>
                Sample records. Approval, rescheduling and history
                actions will activate when connected.
              </span>
            </p>
          )}

          {loading && (
            <div className="ed-state" role="status">
              Loading your dashboard…
            </div>
          )}

          {error && (
            <div className="ed-state" role="alert">
              Could not load your dashboard. Please refresh and try again.
            </div>
          )}

          {!loading && !error && !data && (
            <div className="ed-state">
              Your dashboard data is not available yet.
            </div>
          )}

          {ready && (
            <>

            {/* SUMMARY CARDS */}
              <section
                className="ed-metrics"
                aria-label="Account summary"
              >
                {metrics.map(
                  ({
                    label,
                    value,
                    detail,
                    icon: Icon,
                    href,
                    currency = false,
                  }) => (
                    <a
                      className="ed-metric"
                      href={href}
                      key={label}
                    >
                      <div className="ed-metric-top">
                        <span>{label}</span>

                        <span className="ed-metric-icon">
                          <Icon size={21} aria-hidden="true" />
                        </span>
                      </div>

                      <strong className="ed-metric-value">
                        <AnimatedValue
                          value={value}
                          currency={currency}
                          reducedMotion={reducedMotion}
                        />
                      </strong>

                      <div className="ed-metric-bottom">
                        <span>{detail}</span>
                        <ArrowUpRightIcon
                          size={17}
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                  )
                )}
              </section>

              {/* SERVICE AND PAYMENT CHARTS */}
              <div className="ed-chart-grid">
                <section className="ed-panel ed-activity-panel">
                  <SectionHeading
                    title="Service activity"
                    description="Completed service jobs by month"
                  >
                    <select
                      className="ed-select"
                      aria-label="Service activity period"
                      value={period}
                      onChange={event => setPeriod(event.target.value)}
                    >
                      <option value="6">Last 6 months</option>
                      <option value="3">Last 3 months</option>
                    </select>
                  </SectionHeading>

                  <div className="ed-chart-summary">
                    <strong>
                      <AnimatedValue
                        value={completed}
                        reducedMotion={reducedMotion}
                      />
                    </strong>
                    <span>completed services in this period</span>
                  </div>

                  {chartData.length ? (
                    <div
                      className="ed-area-chart"
                      role="img"
                      aria-label={chartData.map(item =>
                        `${item.month}: ${item.completed} completed services`
                      ).join('; ')}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="ed-service-gradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--ed-accent)"
                                stopOpacity={0.24}
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--ed-accent)"
                                stopOpacity={0.015}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            vertical={false}
                            stroke="var(--ed-line)"
                            strokeDasharray="4 5"
                          />

                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            dy={8}
                            tick={{ fill: 'var(--ed-muted)', fontSize: 12 }}
                          />

                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--ed-muted)', fontSize: 12 }}
                          />

                          <Tooltip content={<ServiceTooltip />} />

                          <Area
                            type="monotone"
                            dataKey="completed"
                            stroke="var(--ed-accent)"
                            strokeWidth={3}
                            fill="url(#ed-service-gradient)"
                            isAnimationActive={!reducedMotion}
                            animationDuration={700}
                            activeDot={{
                              r: 5,
                              strokeWidth: 3,
                              stroke: 'var(--ed-surface)',
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState>No service activity recorded yet.</EmptyState>
                  )}
                </section>

                <section className="ed-panel ed-payment-panel">
                  <SectionHeading
                    title="Payment overview"
                    description="Recorded payments against issued invoices"
                  />

                  {paid + outstanding > 0 ? (
                    <div
                      className="ed-payment-chart"
                      role="img"
                      aria-label={`${money(paid)} paid; ${money(outstanding)} outstanding`}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentChart}
                            dataKey="value"
                            innerRadius="72%"
                            outerRadius="93%"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={paid && outstanding ? 4 : 0}
                            stroke="none"
                            isAnimationActive={!reducedMotion}
                            animationDuration={700}
                          >
                            {paymentChart.map(item => (
                              <Cell key={item.name} fill={item.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="ed-payment-center">
                        <strong>
                          <AnimatedValue
                            value={
                              paid + outstanding > 0
                                ? Math.round(
                                    paid / (paid + outstanding) * 100
                                  )
                                : 0
                            }
                            suffix="%"
                            reducedMotion={reducedMotion}
                          />
                        </strong>
                        <span>paid</span>
                      </div>
                    </div>
                  ) : (
                    <EmptyState>No invoice balances to display.</EmptyState>
                  )}

                  <dl className="ed-payment-legend">
                    <div>
                      <dt><i className="ed-dot--paid" />Paid</dt>
                      <dd>{money(paid)}</dd>
                    </div>
                    <div>
                      <dt><i className="ed-dot--unpaid" />Outstanding</dt>
                      <dd>{money(outstanding)}</dd>
                    </div>
                  </dl>

                  <a className="ed-inline-link" href="#invoices">
                    View invoice breakdown
                    <ArrowUpRightIcon size={16} aria-hidden="true" />
                  </a>
                </section>
              </div>

              {/* ACTIVE JOBS AND QUOTATIONS */}
              <div className="ed-work-grid">
                <section className="ed-panel" id="active-jobs">
                  <SectionHeading
                    title="Active service jobs"
                    description="What is happening with your equipment"
                  >
                    <span className="ed-count">{jobs.length} active</span>
                  </SectionHeading>

                  {!jobs.length ? (
                    <EmptyState>No active service jobs.</EmptyState>
                  ) : jobs.map(job => (
                    <article className="ed-job" key={job.id}>
                      <div className="ed-record-heading">
                        <div>
                          <h3>{job.equipment}</h3>
                          <p className="ed-muted">{job.id} · {job.site}</p>
                        </div>

                        <Status
                          tone={job.status === 'Awaiting approval'
                            ? 'warning'
                            : 'neutral'}
                        >
                          {job.status}
                        </Status>
                      </div>

                      <dl className="ed-job-details">
                        <div>
                          <dt>Reported damage</dt>
                          <dd>{job.damage || 'Not recorded yet'}</dd>
                        </div>
                        <div>
                          <dt>Latest work update</dt>
                          <dd>{job.work || 'Awaiting an update'}</dd>
                        </div>
                      </dl>

                      <p className="ed-update-time">
                        Updated {formatDate(job.updatedAt, true)} · Saudi time
                      </p>
                    </article>
                  ))}
                </section>

                <section className="ed-panel ed-quotation-panel">
                  <SectionHeading
                    title="Awaiting your approval"
                    description="Quotations ready for your review"
                  >
                    <FileTextIcon size={24} aria-hidden="true" />
                  </SectionHeading>

                  {!quotations.length ? (
                    <EmptyState>No quotations awaiting approval.</EmptyState>
                  ) : quotations.map(item => (
                    <article className="ed-quotation" key={item.id}>
                      <Status tone="warning">Action required</Status>
                      <h3>{item.title}</h3>
                      <p className="ed-muted">
                        {item.equipment} · {item.job}
                      </p>

                      <strong className="ed-quotation-price">
                        {money(item.totalMinor)}
                      </strong>

                      <p className="ed-muted">{item.id}</p>

                      <ActionButton
                        onAction={onReviewQuotation}
                        item={item}
                      >
                        Review quotation
                      </ActionButton>
                    </article>
                  ))}
                </section>
              </div>

              {/* MAINTENANCE AND NOTIFICATIONS */}
              <div className="ed-two-column">
                <section className="ed-panel" id="maintenance">
                  <SectionHeading
                    title="Upcoming maintenance"
                    description="Saudi time · Date changes require confirmation"
                  />

                  {!appointments.length ? (
                    <EmptyState>No upcoming visits scheduled.</EmptyState>
                  ) : [...appointments]
                    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
                    .map(item => (
                      <article className="ed-appointment" key={item.id}>
                        <div className="ed-date-tile" aria-hidden="true">
                          <span>
                            {new Intl.DateTimeFormat('en-GB', {
                              month: 'short',
                              timeZone: 'Asia/Riyadh',
                            }).format(new Date(item.startsAt))}
                          </span>
                          <strong>
                            {new Intl.DateTimeFormat('en-GB', {
                              day: '2-digit',
                              timeZone: 'Asia/Riyadh',
                            }).format(new Date(item.startsAt))}
                          </strong>
                        </div>

                        <div className="ed-appointment-body">
                          <h3>{item.equipment}</h3>
                          <p>{formatDate(item.startsAt, true)}</p>
                          <p className="ed-muted">{item.site}</p>

                          {item.reschedulePending ? (
                            <Status tone="warning">
                              Reschedule awaiting confirmation
                            </Status>
                          ) : (
                            <ActionButton
                              onAction={onReschedule}
                              item={item}
                            >
                              Request reschedule
                            </ActionButton>
                          )}
                        </div>
                      </article>
                    ))}
                </section>

                <section className="ed-panel" id="notifications">
                  <SectionHeading
                    title="Recent notifications"
                    description="Service, quotation and payment updates"
                  >
                    <span className="ed-count">{unread} unread</span>
                  </SectionHeading>

                  {!notifications.length ? (
                    <EmptyState>No notifications yet.</EmptyState>
                  ) : notifications.slice(0, 5).map(item => (
                    <article
                      className={`ed-notification ${!item.read ? 'is-unread' : ''}`}
                      key={item.id}
                    >
                      <span className={`ed-event-icon ed-event-icon--${item.tone}`}>
                        {item.tone === 'success' ? (
                          <CheckCircleIcon size={20} aria-hidden="true" />
                        ) : (
                          <BellIcon size={20} aria-hidden="true" />
                        )}
                      </span>

                      <div>
                        <h3>{item.title}</h3>
                        <p className="ed-muted">{item.message}</p>
                        {!item.read && <span className="ed-unread-label">Unread</span>}
                      </div>
                    </article>
                  ))}
                </section>
              </div>

              {/* INVOICES AND PARTIAL PAYMENTS */}
              <section className="ed-panel ed-table-panel" id="invoices">
                <SectionHeading
                  title="Invoices & payments"
                  description="Your invoice totals, confirmed payments and remaining balances"
                >
                  <span className="ed-balance-label">
                    {money(outstanding)} remaining
                  </span>
                </SectionHeading>

                {!invoices.length ? (
                  <EmptyState>No invoices issued yet.</EmptyState>
                ) : (
                  <div
                    className="ed-table-scroll"
                    role="region"
                    aria-label="Invoices and payments"
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          {['Invoice', 'Due date', 'Total', 'Paid', 'Remaining', 'Status']
                            .map(label => (
                              <th key={label} scope="col">{label}</th>
                            ))}
                        </tr>
                      </thead>

                      <tbody>
                        {invoices.map(item => (
                          <tr key={item.id}>
                            <th scope="row">
                              {item.id}
                              <small>{item.description}</small>
                            </th>
                            <td>{formatDate(item.dueDate)}</td>
                            <td>{money(item.totalMinor)}</td>
                            <td>{money(item.paidMinor)}</td>
                            <td className="ed-amount">
                              {money(item.balanceMinor)}
                            </td>
                            <td>
                              <Status
                                tone={item.balanceMinor === 0 ? 'success' : 'warning'}
                              >
                                {item.balanceMinor === 0
                                  ? 'Paid'
                                  : item.paidMinor > 0
                                    ? 'Partially paid'
                                    : 'Unpaid'}
                              </Status>

                              {item.overdue && item.balanceMinor > 0 && (
                                <small className="ed-overdue">Overdue</small>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* EQUIPMENT AND SERVICE HISTORY */}
              <section className="ed-panel ed-table-panel" id="equipment">
                <SectionHeading
                  title="Your equipment"
                  description="AMC coverage, equipment status and service history"
                >
                  <label className="ed-search">
                    <span className="ed-sr-only">Search equipment</span>
                    <input
                      type="search"
                      placeholder="Search equipment or site"
                      value={query}
                      onChange={event => setQuery(event.target.value)}
                    />
                  </label>
                </SectionHeading>

                {!visibleEquipment.length ? (
                  <EmptyState>
                    {equipment.length
                      ? 'No equipment matches your search.'
                      : 'No equipment has been added to your account.'}
                  </EmptyState>
                ) : (
                  <div
                    className="ed-table-scroll"
                    role="region"
                    aria-label="Customer equipment"
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          {['Equipment', 'Site', 'Coverage', 'Status', 'Last service', 'History']
                            .map(label => (
                              <th key={label} scope="col">{label}</th>
                            ))}
                        </tr>
                      </thead>

                      <tbody
                        className="ed-equipment-results"
                        key={query.trim().toLowerCase()}
                      >
                        {visibleEquipment.map(item => (
                          <tr key={item.id}>
                            <th scope="row">
                              {item.name}
                              <small>{item.id} · {item.model}</small>
                            </th>
                            <td>{item.site}</td>
                            <td>
                              <Status tone={item.coverage === 'AMC' ? 'success' : 'neutral'}>
                                {item.coverage}
                              </Status>
                            </td>
                            <td>{item.status}</td>
                            <td>{formatDate(item.lastService)}</td>
                            <td>
                              <ActionButton
                                onAction={onOpenEquipment}
                                item={item}
                              >
                                Service history
                              </ActionButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* REPORTS AND COMPLETION CARDS */}
              <section className="ed-panel" id="documents">
                <SectionHeading
                  title="Latest reports & completion cards"
                  description="Inspection reports and completed-job documents"
                />

                {!documents.length ? (
                  <EmptyState>No documents have been issued yet.</EmptyState>
                ) : (
                  <div className="ed-document-grid">
                    {documents.slice(0, 4).map(item => (
                      <article className="ed-document" key={item.id}>
                        <span className="ed-document-icon">
                          <FilePdfIcon size={29} aria-hidden="true" />
                        </span>

                        <div>
                          <h3>{item.title}</h3>
                          <p className="ed-muted">{item.type} · {item.job}</p>
                          <p className="ed-muted">{formatDate(item.issuedOn)}</p>

                          {item.url && /^(https?:\/\/|\/(?!\/))/.test(item.url) ? (
                            <a
                              className="ed-inline-link"
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open PDF
                              <ArrowUpRightIcon size={16} aria-hidden="true" />
                              <span className="ed-sr-only">
                                : {item.title} (opens in a new tab)
                              </span>
                            </a>
                          ) : (
                            <span className="ed-file-unavailable">
                              PDF not available in preview
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          <footer className="ed-footer">
            <span>© {new Date().getFullYear()} Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Contact support</a>
          </footer>
        </main>
      </div>
    </div>
  )
}