import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  BellIcon,
  CalendarBlankIcon,
  CheckIcon,
  ChecksIcon,
  ClipboardTextIcon,
  FileTextIcon,
  MoonIcon,
  ReceiptIcon,
  SunIcon,
  WrenchIcon,
} from '@phosphor-icons/react'

import CustomerNavbar from '../components/CustomerNavbar'
import { NOTIFICATIONS_PREVIEW_DATA } from '../data/notificationsPreviewData'
import './NotificationsPage.css'

// =========================================================
// FRONTEND DATA CONTRACT
//
// data = {
//   is_demo, now (optional ISO), company_name,
//   notifications: [{ id, category, event_type, title, message,
//                     created_at, is_read, to, action_label }]
// }
//
// The API must return only notifications addressed to the signed-in
// account holder. The unread count shown in the sidebar is derived from
// these records, never hardcoded.
// Marking a notification as read never approves, pays or accepts anything.
// =========================================================

const TZ = 'Asia/Riyadh'
const GROUPS = ['Today', 'Yesterday', 'Earlier']

const CATEGORIES = {
  quotations: { label: 'Quotations', icon: FileTextIcon },
  reports: { label: 'Reports', icon: ClipboardTextIcon },
  service: { label: 'Service', icon: WrenchIcon },
  schedule: { label: 'Schedule', icon: CalendarBlankIcon },
  billing: { label: 'Billing', icon: ReceiptIcon },
}

function parse(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function fmtDateTime(value) {
  const date = parse(value)
  if (!date) return 'Time not recorded'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(date)
}

function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date)
}

function groupLabel(value, now) {
  const date = parse(value)
  if (!date) return 'Earlier'
  const key = dayKey(date)
  if (key === dayKey(now)) return 'Today'
  if (key === dayKey(new Date(now.getTime() - 86400000))) return 'Yesterday'
  return 'Earlier'
}

function relative(value, now) {
  const date = parse(value)
  if (!date) return ''
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

function initialTheme() {
  try {
    const saved = localStorage.getItem('ethijahath-dashboard-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Theme persistence is optional.
  }
  return 'light'
}

function Message({ icon: Icon, title, children, action }) {
  return (
    <div className="nt-message">
      {Icon && <Icon size={32} aria-hidden="true" />}
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  )
}

// =========================================================
// NOTIFICATIONS PAGE
// =========================================================

export default function NotificationsPage({
  data = NOTIFICATIONS_PREVIEW_DATA,
  loading = false,
  error = '',
  onSignOut,
  onMarkRead, // async (id) => void. Throw to report a failure.
  onMarkAllRead, // async () => void
  onOpenRecord, // (notification) => void. Defaults to navigate(notification.to)
}) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(initialTheme)
  const [items, setItems] = useState(data?.notifications ?? [])
  const [view, setView] = useState('all')
  const [category, setCategory] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [busyAll, setBusyAll] = useState(false)
  const [notice, setNotice] = useState({ type: '', text: '' })

  useEffect(() => {
    try {
      localStorage.setItem('ethijahath-dashboard-theme', theme)
    } catch {
      // The page remains usable without storage.
    }
  }, [theme])

  useEffect(() => {
    setItems(data?.notifications ?? [])
  }, [data])

  const ready = !loading && !error && Boolean(data)
  const now = useMemo(() => (data?.now ? new Date(data.now) : new Date()), [data?.now])
  const unread = items.filter(item => !item.is_read).length

  const visible = items
    .filter(item => (view === 'unread' ? !item.is_read : true))
    .filter(item => (category === 'all' ? true : item.category === category))
    .sort((a, b) => parse(b.created_at) - parse(a.created_at))

  const grouped = GROUPS.map(label => ({
    label,
    items: visible.filter(item => groupLabel(item.created_at, now) === label),
  })).filter(group => group.items.length)

  async function markRead(item) {
    if (item.is_read) return true
    setBusyId(item.id)
    setNotice({ type: '', text: '' })
    try {
      await onMarkRead?.(item.id)
      setItems(list => list.map(entry => (entry.id === item.id ? { ...entry, is_read: true } : entry)))
      return true
    } catch (failure) {
      setNotice({
        type: 'error',
        text: failure instanceof Error ? failure.message : 'Could not mark this notification as read.',
      })
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function markAllRead() {
    if (!unread || busyAll) return
    setBusyAll(true)
    setNotice({ type: '', text: '' })
    try {
      await onMarkAllRead?.()
      setItems(list => list.map(entry => ({ ...entry, is_read: true })))
      setNotice({ type: 'success', text: 'All notifications marked as read.' })
    } catch (failure) {
      setNotice({
        type: 'error',
        text: failure instanceof Error ? failure.message : 'Could not mark all notifications as read.',
      })
    } finally {
      setBusyAll(false)
    }
  }

  async function openRecord(item) {
    await markRead(item)
    if (onOpenRecord) onOpenRecord(item)
    else if (item.to) navigate(item.to)
  }

  function clearFilters() {
    setView('all')
    setCategory('all')
  }

  return (
    <div className="nt-page" data-theme={theme}>
      <CustomerNavbar
        theme={theme}
        companyName={ready ? data.company_name : undefined}
        customerName="Customer account"
        unreadCount={unread}
        onSignOut={onSignOut}
      />

      <div className="nt-main">
        <header className="nt-topbar">
          <span>
            Customer portal / <strong>Notifications</strong>
          </span>

          <button
            className="nt-theme-button"
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={() => setTheme(value => (value === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <MoonIcon size={21} aria-hidden="true" /> : <SunIcon size={21} aria-hidden="true" />}
          </button>
        </header>

        <main className="nt-content" id="notifications-content" tabIndex={-1} aria-busy={loading}>
          <div className="nt-heading">
            <h1>Notifications</h1>
            <p>Updates and reminders about your equipment, quotations, visits and invoices.</p>
          </div>

          {loading && (
            <div className="nt-message" role="status">
              Loading your notifications…
            </div>
          )}

          {error && (
            <div className="nt-message" role="alert">
              Could not load your notifications. Please refresh and try again.
            </div>
          )}

          {!loading && !error && !data && (
            <Message icon={BellIcon} title="Notifications are not connected yet">
              Your updates will appear here once the notifications API is connected.
            </Message>
          )}

          {ready && (
            <>
              {data.is_demo && (
                <p className="nt-demo-notice">
                  Preview mode · Fictional notifications. No live backend connection. No email or other message is
                  sent.
                </p>
              )}

              <section className="nt-toolbar" aria-label="Notification controls">
                <div className="nt-toolbar-row">
                  <div className="nt-segments" role="group" aria-label="Show notifications">
                    <button
                      type="button"
                      className="nt-segment"
                      aria-pressed={view === 'all'}
                      onClick={() => setView('all')}
                    >
                      All <span className="nt-segment-count">{items.length}</span>
                    </button>
                    <button
                      type="button"
                      className="nt-segment"
                      aria-pressed={view === 'unread'}
                      onClick={() => setView('unread')}
                    >
                      Unread <span className="nt-segment-count">{unread}</span>
                    </button>
                  </div>

                  <label className="nt-filter">
                    <span>Category</span>
                    <select value={category} onChange={event => setCategory(event.target.value)}>
                      <option value="all">All categories</option>
                      {Object.entries(CATEGORIES).map(([value, { label }]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    className="nt-action nt-action--solid nt-mark-all"
                    type="button"
                    disabled={!unread || busyAll}
                    aria-busy={busyAll}
                    onClick={markAllRead}
                  >
                    <ChecksIcon size={18} aria-hidden="true" />
                    {busyAll ? 'Marking…' : 'Mark all as read'}
                  </button>
                </div>

                <p className="nt-note">
                  Marking a notification as read only clears it from your unread list. It does not approve a
                  quotation, pay an invoice or accept a visit.
                </p>
              </section>

              <p className="nt-results" role="status" aria-live="polite">
                {unread} unread · Showing {visible.length} of {items.length} notifications · Times are Saudi time
                (UTC+3)
              </p>

              {notice.text && (
                <p
                  className={`nt-notice nt-notice--${notice.type}`}
                  role={notice.type === 'error' ? 'alert' : 'status'}
                >
                  {notice.text}
                </p>
              )}

              {!items.length ? (
                <Message icon={BellIcon} title="No notifications yet">
                  When there is news about your quotations, visits, reports or invoices, it will appear here.
                </Message>
              ) : !visible.length ? (
                <Message
                  icon={CheckIcon}
                  title={view === 'unread' ? 'You are all caught up' : 'No matching notifications'}
                  action={
                    <button type="button" className="nt-message-button" onClick={clearFilters}>
                      Show all notifications
                    </button>
                  }
                >
                  {view === 'unread'
                    ? 'There are no unread notifications in this category.'
                    : 'Try a different category.'}
                </Message>
              ) : (
                grouped.map(group => (
                  <section className="nt-group" key={group.label} aria-labelledby={`nt-group-${group.label}`}>
                    <h2 id={`nt-group-${group.label}`} className="nt-group-title">
                      {group.label}
                    </h2>

                    <ul className="nt-list">
                      {group.items.map(item => {
                        const meta = CATEGORIES[item.category] || { label: 'Update', icon: BellIcon }
                        const Icon = meta.icon

                        return (
                          <li key={item.id}>
                            <article className={`nt-item${item.is_read ? '' : ' is-unread'}`}>
                              <span className="nt-icon">
                                <Icon size={24} aria-hidden="true" />
                              </span>

                              <div className="nt-body">
                                <div className="nt-head">
                                  <h3>{item.title}</h3>
                                  <div className="nt-badges">
                                    <span className="nt-badge nt-badge--muted">{meta.label}</span>
                                    {!item.is_read && <span className="nt-badge">New</span>}
                                  </div>
                                </div>

                                <p className="nt-text">{item.message}</p>

                                <time className="nt-time" dateTime={item.created_at} title={fmtDateTime(item.created_at)}>
                                  {relative(item.created_at, now)} · {fmtDateTime(item.created_at)}
                                </time>

                                <div className="nt-actions">
                                  {item.to && (
                                    <button
                                      className="nt-action nt-action--solid"
                                      type="button"
                                      disabled={busyId === item.id}
                                      onClick={() => openRecord(item)}
                                    >
                                      {item.action_label || 'Open'}
                                      <ArrowRightIcon size={16} aria-hidden="true" />
                                    </button>
                                  )}

                                  {!item.is_read && (
                                    <button
                                      className="nt-action"
                                      type="button"
                                      disabled={busyId === item.id}
                                      aria-label={`Mark “${item.title}” as read`}
                                      onClick={() => markRead(item)}
                                    >
                                      <CheckIcon size={16} aria-hidden="true" />
                                      {busyId === item.id ? 'Marking…' : 'Mark as read'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </article>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))
              )}
            </>
          )}

          <footer className="nt-footer">
            <span>Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Contact support</a>
          </footer>
        </main>
      </div>
    </div>
  )
}