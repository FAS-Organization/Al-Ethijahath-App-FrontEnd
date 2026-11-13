import { useContext, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRightIcon,
  BellIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ChecksIcon,
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
import { NotificationsPreviewContext } from '../data/notificationsPreviewData'
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

const relativeTime = new Intl.RelativeTimeFormat('en', {
  numeric: 'always',
  style: 'short',
})

function formatNotificationTime(value, now) {
  const date = new Date(value)
  const minutes = Math.floor((now - date.getTime()) / 60000)

  if (!Number.isFinite(minutes)) return 'Date unavailable'
  if (minutes < 0 || minutes >= 10080) return dateTime.format(date)
  if (minutes === 0) return 'Just now'
  if (minutes < 60) return relativeTime.format(-minutes, 'minute')
  if (minutes < 1440) return relativeTime.format(-Math.floor(minutes / 60), 'hour')

  return relativeTime.format(-Math.floor(minutes / 1440), 'day')
}

function NotificationCard({ item, onRead, now }) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const category = CATEGORIES[item.category]
  const Icon = item.positive ? CheckCircleIcon : category.icon
  const unread = !item.read_at
  const readAction = unread ? 'Mark as read' : 'Mark as unread'
  const absoluteTime = dateTime.format(new Date(item.created_at))

  return (
    <article
      className={`np-card np-card--${item.priority}${item.positive ? ' is-positive' : ''}`}
      data-unread={unread}
      data-expanded={expanded}
    >
      <span className="np-event-icon">
        <Icon size={19} aria-hidden="true" />
      </span>

      <div className="np-card-content">
        <div className="np-title-line">
          <h3>
            <Link
              to={item.destination_path}
              onClick={() => onRead(item.id, true)}
            >
              {item.title}
            </Link>
          </h3>

          {item.priority === 'high' ? (
            <span className="np-badge np-badge--high">Overdue</span>
          ) : item.requires_action ? (
            <span className="np-badge np-badge--action">Action required</span>
          ) : null}

          {unread && (
            <span className="np-unread-dot">
              <span className="np-sr-only">Unread</span>
            </span>
          )}
        </div>

        <p className="np-message">{item.message}</p>

        <div id={detailsId} className="np-row-details" hidden={!expanded}>
          <span>{category.label}</span>
          {item.reference && <strong>{item.reference}</strong>}
          {item.site && <span>{item.site}</span>}
          <span>{absoluteTime} Saudi time</span>
        </div>
      </div>

      <div className="np-row-tools">
        <time dateTime={item.created_at} title={`${absoluteTime} Saudi time`}>
          {formatNotificationTime(item.created_at, now)}
        </time>

        <button
          type="button"
          className="np-read-button"
          title={readAction}
          aria-label={`${readAction}: ${item.title}, ${item.reference}`}
          onClick={() => onRead(item.id, unread)}
        >
          {unread ? 'Mark as read' : <ChecksIcon size={20} aria-hidden="true" />}
        </button>

        <button
          type="button"
          className="np-details-button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? 'Less' : 'Details'}
        </button>
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
    const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

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



  function showPaymentAlerts() {
    setFilters({ ...INITIAL_FILTERS, view: 'attention', category: 'billing' })
    setLimit(PAGE_SIZE)
    resultsRef.current?.focus({ preventScroll: true })
    resultsRef.current?.scrollIntoView({ block: 'start' })
  }

  const views = [
    { id: 'all', label: 'All updates', count: items.length, icon: FileTextIcon },
    { id: 'unread', label: 'Unread', count: unread, icon: BellIcon },
    { id: 'attention', label: 'Needs action', count: attention, icon: LightningIcon },
    { id: 'read', label: 'Read', count: items.length - unread, icon: ChecksIcon },
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

            <div className="np-heading-actions">

              <button
                type="button"
                className="np-button"
                disabled={!unread}
                onClick={markAllRead}
              >
                <CheckCircleIcon size={18} aria-hidden="true" />
                Mark all as read
              </button>
            </div>
          </div>

                    {(overdue > 0 || approvals > 0) && (
            <div className="np-alert-strip" role="group" aria-label="Outstanding actions">
              {overdue > 0 && (
                <button
                  type="button"
                  className="np-alert np-alert--critical"
                  onClick={showPaymentAlerts}
                >
                  <LightningIcon size={17} weight="fill" aria-hidden="true" />
                  {overdue} overdue {overdue === 1 ? 'invoice' : 'invoices'}
                  <ArrowUpRightIcon size={15} aria-hidden="true" />
                </button>
              )}

              {approvals > 0 && (
                <Link className="np-alert np-alert--approval" to="/quotations">
                  <FileTextIcon size={17} aria-hidden="true" />
                  {approvals} awaiting review
                  <ArrowUpRightIcon size={15} aria-hidden="true" />
                </Link>
              )}
            </div>
          )}

          <section className="np-inbox" aria-labelledby="np-inbox-title">
            <h2 id="np-inbox-title" className="np-sr-only">Your updates</h2>

            <div className="np-tabs" role="group" aria-label="Read status and actions">
              {views.map(({ id, label, count, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  className="np-tab"
                  aria-pressed={filters.view === id}
                  onClick={() => changeFilters({ view: id })}
                >
                  <Icon className="np-tab-icon" size={16} aria-hidden="true" />
                  <span className="np-tab-label">{label}</span>
                  <span className="np-tab-count">{count}</span>
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
                <select
                  name="notification-category"
                  aria-label="Category"
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
                <select
                  name="notification-sort"
                  aria-label="Sort"
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
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onRead={markRead}
                    now={now}
                  />
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