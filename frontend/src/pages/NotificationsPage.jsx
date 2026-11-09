import { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRightIcon,
  BellIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  FileTextIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MoonIcon,
  ReceiptIcon,
  SunIcon,
  WrenchIcon,
} from '@phosphor-icons/react'

import CustomerNavbar from '../components/CustomerNavbar'
import DateRangeFilter from '../components/DateRangeFilter'
import { inDateRange } from '../utils/dateRange'
import {
  createNotificationsPreviewData,
  NotificationsPreviewContext,
} from '../data/notificationsPreviewData'
import './NotificationsPage.css'

const THEME_KEY = 'ethijahath-dashboard-theme'
const PAGE_SIZE = 8

const CATEGORIES = {
  billing: { label: 'Invoices & payments', icon: ReceiptIcon },
  quotations: { label: 'Quotations', icon: FileTextIcon },
  reports: { label: 'Inspection reports', icon: FileTextIcon },
  services: { label: 'Service jobs', icon: WrenchIcon },
  schedule: { label: 'Service schedule', icon: CalendarBlankIcon },
}

const INITIAL_FILTERS = {
  query: '',
  category: 'all',
  site: 'all',
  view: 'all',
  from: '',
  to: '',
  sort: 'priority',
}

const PRIORITY_ORDER = { high: 0, attention: 1, normal: 2 }

const dateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Riyadh',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function initialTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function NotificationCard({ item, onRead }) {
  const category = CATEGORIES[item.category]
  const Icon = item.positive ? CheckCircleIcon : category.icon
  const unread = !item.read_at

  return (
    <article
      className={`np-card np-card--${item.priority}${item.positive ? ' is-positive' : ''}`}
    >
      <span className="np-event-icon">
        <Icon size={24} aria-hidden="true" />
      </span>

      <div className="np-card-content">
        <div className="np-card-meta">
          <span>{category.label}</span>

          {item.priority === 'high' ? (
            <span className="np-badge np-badge--high">Overdue</span>
          ) : item.requires_action ? (
            <span className="np-badge np-badge--action">Action required</span>
          ) : null}

          <span className={`np-read-label${unread ? ' is-unread' : ''}`}>
            {unread ? 'Unread' : 'Read'}
          </span>
        </div>

        <h3>{item.title}</h3>
        <p className="np-message">{item.message}</p>

        <div className="np-reference">
          <strong>{item.reference}</strong>
          {item.site && (
            <span>
              <MapPinIcon size={14} aria-hidden="true" />
              {item.site}
            </span>
          )}
        </div>

        <div className="np-card-bottom">
          <time dateTime={item.created_at} title="Saudi time">
            {dateTime.format(new Date(item.created_at))}
          </time>

          <div className="np-card-actions">
            <button
              type="button"
              className="np-text-button"
              onClick={() => onRead(item.id, unread)}
            >
              {unread ? 'Mark as read' : 'Mark as unread'}
              <span className="np-sr-only"> · {item.title}, {item.reference}</span>
            </button>

            <Link
              className="np-record-link"
              to={item.destination_path}
              onClick={() => onRead(item.id, true)}
            >
              {item.action_label}
              <ArrowUpRightIcon size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function NotificationsPage() {
  const store = useContext(NotificationsPreviewContext)
  const [theme, setTheme] = useState(initialTheme)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [announcement, setAnnouncement] = useState('')
  const resultsRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Theme still works when browser storage is unavailable.
    }
  }, [theme])

  if (!store) {
    return <main><h1>Notification preview is unavailable</h1></main>
  }

  const { data, setData } = store
  const { items } = data
  const unread = items.filter(item => !item.read_at).length
  const attention = items.filter(item => item.requires_action).length
  const overdue = items.filter(item =>
    item.event_type === 'payment_overdue' && item.requires_action,
  ).length
  const approvals = items.filter(item =>
    ['quotations', 'reports'].includes(item.category) && item.requires_action,
  ).length
  const sites = [...new Set(items.map(item => item.site).filter(Boolean))].sort()
  const query = filters.query.trim().toLowerCase()
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to)

  const visible = items.filter(item => {
    const matchesView =
      filters.view === 'all' ||
      (filters.view === 'unread' && !item.read_at) ||
      (filters.view === 'read' && Boolean(item.read_at)) ||
      (filters.view === 'attention' && item.requires_action)

    const searchable = [
      item.title,
      item.message,
      item.reference,
      item.site,
    ].join(' ').toLowerCase()

    return (
      matchesView &&
      !invalidRange &&
      (filters.category === 'all' || item.category === filters.category) &&
      (filters.site === 'all' || item.site === filters.site) &&
      searchable.includes(query) &&
      inDateRange(item.created_at, filters.from, filters.to)
    )
  }).sort((first, second) => {
    if (filters.sort === 'priority') {
      const difference = PRIORITY_ORDER[first.priority] - PRIORITY_ORDER[second.priority]
      if (difference) return difference
    }

    return new Date(second.created_at) - new Date(first.created_at)
  })

  function changeFilters(patch) {
    setFilters(current => ({ ...current, ...patch }))
    setLimit(PAGE_SIZE)
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS)
    setLimit(PAGE_SIZE)
  }

  function markRead(id, read) {
    const stamp = new Date().toISOString()

    setData(current => ({
      ...current,
      items: current.items.map(item =>
        item.id === id
          ? { ...item, read_at: read ? item.read_at || stamp : null }
          : item,
      ),
    }))

    setAnnouncement(read ? 'Notification marked as read.' : 'Notification marked as unread.')

    if (filters.view === 'unread' || filters.view === 'read') {
      resultsRef.current?.focus({ preventScroll: true })
    }
  }

  function markAllRead() {
    const stamp = new Date().toISOString()

    setData(current => ({
      ...current,
      items: current.items.map(item =>
        item.read_at ? item : { ...item, read_at: stamp },
      ),
    }))

    setAnnouncement('All notifications marked as read.')
    resultsRef.current?.focus({ preventScroll: true })
  }

  function resetPreview() {
    setData(createNotificationsPreviewData())
    clearFilters()
    setAnnouncement('Preview notifications reset.')
  }

  function showPaymentAlerts() {
    setFilters({ ...INITIAL_FILTERS, view: 'attention', category: 'billing' })
    setLimit(PAGE_SIZE)
    resultsRef.current?.focus({ preventScroll: true })
    resultsRef.current?.scrollIntoView({ block: 'start' })
  }

  const views = [
    { id: 'all', label: 'All updates', count: items.length },
    { id: 'unread', label: 'Unread', count: unread },
    { id: 'attention', label: 'Needs action', count: attention },
    { id: 'read', label: 'Read', count: items.length - unread },
  ]

  return (
    <div className="np-page" data-theme={theme}>
      <CustomerNavbar
        companyName={data.company_name}
        customerName={data.customer_name}
        theme={theme}
      />

      <main className="np-main">
        <header className="np-topbar">
          <div className="np-breadcrumb">
            <span>Customer portal</span>
            <span aria-hidden="true">/</span>
            <strong>Notifications</strong>
          </div>

          <div className="np-topbar-actions">
            <span className="np-region">
              <MapPinIcon size={17} aria-hidden="true" />
              {data.region_name}
            </span>

            <button
              type="button"
              className="np-icon-button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              onClick={() => setTheme(value => value === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light'
                ? <MoonIcon size={20} aria-hidden="true" />
                : <SunIcon size={20} aria-hidden="true" />}
            </button>
          </div>
        </header>

        <div className="np-content">
          <div className="np-heading">
            <div>
              <h1>Notifications</h1>
              <p>Service visits, approval requests and payment updates for your account.</p>
            </div>

            <button type="button" className="np-button" disabled={!unread} onClick={markAllRead}>
              <CheckCircleIcon size={18} aria-hidden="true" />
              Mark all as read
            </button>
          </div>

          <div className="np-preview">
            <p>
              <strong>Frontend preview.</strong> Read status resets on refresh.
              Schedule reminders use the {data.schedule_preview_date} demo snapshot.
            </p>
            <button type="button" className="np-text-button" onClick={resetPreview}>
              Reset preview
            </button>
          </div>

          <section className="np-priorities" aria-label="Outstanding actions">
            <div className={`np-priority-panel${overdue ? ' has-critical' : ''}`}>
              <span className="np-priority-icon">
                <LightningIcon size={28} weight="fill" aria-hidden="true" />
              </span>
              <div>
                <h2>
                  {overdue
                    ? `${overdue} overdue ${overdue === 1 ? 'invoice' : 'invoices'}`
                    : 'No overdue payment alerts'}
                </h2>
                <p>Check the remaining balance and confirmed payments for each invoice.</p>
                {overdue > 0 && (
                  <button type="button" className="np-priority-link" onClick={showPaymentAlerts}>
                    Review payment alerts
                    <ArrowUpRightIcon size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="np-approval-panel">
              <span className="np-priority-icon">
                <FileTextIcon size={27} aria-hidden="true" />
              </span>
              <div>
                <h2>{approvals ? `${approvals} awaiting your review` : 'No approvals waiting'}</h2>
                <p>Quotation decisions and inspection signatures.</p>
                <Link className="np-priority-link" to="/quotations">
                  Open inspections &amp; quotations
                  <ArrowUpRightIcon size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          <section className="np-inbox" aria-labelledby="np-inbox-title">
            <div className="np-inbox-heading">
              <div>
                <h2 id="np-inbox-title">Your updates</h2>
                <p>Open the related record to review or resolve an outstanding action.</p>
              </div>
              <span className="np-total">
                <BellIcon size={17} aria-hidden="true" />
                {unread} unread
              </span>
            </div>

            <div className="np-tabs" role="group" aria-label="Read status and actions">
              {views.map(view => (
                <button
                  type="button"
                  key={view.id}
                  className={`np-tab${filters.view === view.id ? ' is-active' : ''}`}
                  aria-pressed={filters.view === view.id}
                  onClick={() => changeFilters({ view: view.id })}
                >
                  {view.label}
                  <span>{view.count}</span>
                </button>
              ))}
            </div>

            <div className="np-filters">
              <label className="np-search">
                <MagnifyingGlassIcon size={20} aria-hidden="true" />
                <span className="np-sr-only">Search notifications</span>
                <input
                  type="search"
                  name="notification-search"
                  placeholder="Search invoice, service or message"
                  value={filters.query}
                  onChange={event => changeFilters({ query: event.target.value })}
                />
              </label>

              <label className="np-select">
                <span>Category</span>
                <select
                  name="notification-category"
                  value={filters.category}
                  onChange={event => changeFilters({ category: event.target.value })}
                >
                  <option value="all">All categories</option>
                  {Object.entries(CATEGORIES).map(([id, category]) => (
                    <option key={id} value={id}>{category.label}</option>
                  ))}
                </select>
              </label>

              <label className="np-select">
                <span>Sort</span>
                <select
                  name="notification-sort"
                  value={filters.sort}
                  onChange={event => changeFilters({ sort: event.target.value })}
                >
                  <option value="priority">Priority first</option>
                  <option value="newest">Newest first</option>
                </select>
              </label>

              <details className="np-more-filters">
                <summary>
                  Filter by site or date
                  {(filters.site !== 'all' || filters.from || filters.to) && ' · Active'}
                </summary>
                <div className="np-more-fields">
                  <label className="np-select">
                    <span>Site</span>
                    <select
                      name="notification-site"
                      value={filters.site}
                      onChange={event => changeFilters({ site: event.target.value })}
                    >
                      <option value="all">All sites</option>
                      {sites.map(site => <option key={site} value={site}>{site}</option>)}
                    </select>
                  </label>

                  <DateRangeFilter
                    from={filters.from}
                    to={filters.to}
                    label="Notification date"
                    onChange={(from, to) => changeFilters({ from, to })}
                  />
                </div>
              </details>
            </div>

            {invalidRange && (
              <p className="np-error" role="alert">Choose an end date on or after the start date.</p>
            )}

            <div className="np-results" ref={resultsRef} tabIndex={-1}>
              <p role="status">
                Showing {Math.min(limit, visible.length)} of {visible.length} matching updates
              </p>
              <button type="button" className="np-text-button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>

            <p className="np-sr-only" role="status">{announcement}</p>

            {visible.length ? (
              <div className="np-list">
                {visible.slice(0, limit).map(item => (
                  <NotificationCard key={item.id} item={item} onRead={markRead} />
                ))}
              </div>
            ) : (
              <div className="np-empty">
                <BellIcon size={36} aria-hidden="true" />
                <h3>
                  {!items.length
                    ? 'No notifications yet'
                    : filters.view === 'unread' && !unread
                      ? 'No unread notifications'
                      : 'No matching notifications'}
                </h3>
                <p>
                  {items.length
                    ? 'Clear the filters to see all updates.'
                    : 'Service, approval and payment updates will appear here.'}
                </p>
              </div>
            )}

            {visible.length > limit && (
              <div className="np-load-more">
                <button
                  type="button"
                  className="np-button np-button--secondary"
                  onClick={() => setLimit(value => value + PAGE_SIZE)}
                >
                  Show more updates
                </button>
              </div>
            )}
          </section>

          <footer className="np-footer">
            <span>Al Ethijahath</span>
            <span>Dates and times use Saudi time.</span>
          </footer>
        </div>
      </main>
    </div>
  )
}