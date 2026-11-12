import { useContext, useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  SquaresFourIcon, TruckIcon, WrenchIcon, CalendarBlankIcon,
  FileTextIcon, ReceiptIcon, FolderOpenIcon, BellIcon,
  UserCircleIcon, HeadsetIcon, SignOutIcon, ListIcon, XIcon,
  WhatsappLogoIcon, EnvelopeSimpleIcon, PhoneCallIcon,
  SparkleIcon, ArrowUpRightIcon,
} from '@phosphor-icons/react'
import { NotificationsPreviewContext } from '../data/notificationsPreviewData'
import './CustomerNavbar.css'


// Frontend destinations, not Django API endpoints.
// Enable each destination only after its page is connected to your router.
export const CUSTOMER_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', to: '/dashboard', icon: SquaresFourIcon, end: true },
  { id: 'equipment', label: 'My equipment', to: '/equipment', icon: TruckIcon },
  { id: 'services', label: 'Service jobs', to: '/services', icon: WrenchIcon },
  { id: 'maintenance', label: 'AMC & service', to: '/maintenance', icon: CalendarBlankIcon },
  { id: 'quotations', label: 'Inspections & quotations', to: '/quotations', icon: FileTextIcon },
  { id: 'billing', label: 'Invoices & payments', to: '/billing', icon: ReceiptIcon },
  { id: 'documents', label: 'Reports & documents', to: '/documents', icon: FolderOpenIcon },
  { id: 'notifications', label: 'Notifications', to: '/notifications', icon: BellIcon },
  { id: 'account', label: 'My account', to: '/account', icon: UserCircleIcon },
]
const INITIAL_PAGES = [
  'overview',
  'equipment',
  'quotations',
  'services',
  'maintenance',
  'billing',
  'documents',
  'notifications',
  'account',
]

// Support contact details shown in the Support pop-up.
const SUPPORT_PHONE_DISPLAY = '+966 50 937 4109'
const SUPPORT_PHONE_LINK = '+966509374109'
const SUPPORT_EMAIL = 'info@alethijahath.com'

/** Render once within BrowserRouter, outside individual page contents.
 * onSignOut must await your real logout request and clear authenticated state.
 * No session, identity, badge counts, or backend endpoints are fabricated here.
 */
export default function CustomerNavbar({
  companyName,
  customerName,
  unreadCount = 0,
  enabledPages = INITIAL_PAGES,
  onSignOut,
  theme = 'light',
}) {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')
  const rootRef = useRef(null)
  const supportRef = useRef(null)
  const toggleRef = useRef(null)
  const busyRef = useRef(false)
  const menuId = useId()
  const location = useLocation()
  const [openedAt, setOpenedAt] = useState(null)
  // Route changes also close the disclosure, including browser Back/Forward.
  const expanded = open && openedAt === location.key
  const notificationStore = useContext(NotificationsPreviewContext)
  const badgeCount = notificationStore
    ? notificationStore.data.items.filter(item => !item.read_at).length
    : unreadCount

  const count = Number.isFinite(badgeCount) ? Math.max(0, Math.floor(badgeCount)) : 0

  useEffect(() => {
    if (!expanded) return
    function dismiss(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function escape(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    function resize(event) { if (event.matches) setOpen(false) }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    desktop.addEventListener('change', resize)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
      desktop.removeEventListener('change', resize)
    }
  }, [expanded])

  async function signOut() {
    if (!onSignOut || busyRef.current) return
    busyRef.current = true
    setSigningOut(true)
    setError('')
    try {
      await onSignOut()
      setOpen(false)
    } catch {
      setError('Could not sign out. Please try again.')
    } finally {
      busyRef.current = false
      setSigningOut(false)
    }
  }
  function openSupport() {
    setOpen(false)
    const dialog = supportRef.current
    if (!dialog || dialog.open) return
    delete dialog.dataset.closing
    dialog.showModal()
  }

  // Slides the panel back down, then closes it.
function closeSupport() {
  const dialog = supportRef.current;

  if (!dialog || !dialog.open || dialog.dataset.closing) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dialog.close();
    return;
  }

  dialog.dataset.closing = 'true';

  setTimeout(() => {
    dialog.close();
    delete dialog.dataset.closing;
  }, 900);
}
  return (
    <aside ref={rootRef} className="ae-nav" data-theme={theme} aria-label="Customer portal navigation">
      <div className="ae-nav__header">
        <NavLink className="ae-nav__brand" to="/dashboard" aria-label="Al Ethijahath customer overview"
          onClick={() => setOpen(false)}>
          <img
            src={theme === 'dark' ? '/images/logo-dark.webp' : '/images/logo.webp'}
            alt="Al Ethijahath"
            width="160"
            height="50"
          />
        </NavLink>
        <button ref={toggleRef} type="button" className="ae-nav__toggle"
          aria-expanded={expanded} aria-controls={menuId}
          aria-label={expanded ? 'Close navigation' : 'Open navigation'}
          onClick={() => { setOpenedAt(location.key); setOpen(!expanded) }}>
          {expanded ? <XIcon size={24} aria-hidden="true" /> : <ListIcon size={24} aria-hidden="true" />}
        </button>
      </div>

      <div id={menuId} className="ae-nav__body" data-open={expanded}>
        <div className="ae-nav__identity">
          <strong>{companyName || 'Customer portal'}</strong>
          {customerName ? <span>{customerName}</span> : null}
        </div>

        <nav aria-label="Customer pages">
          <ul className="ae-nav__links">
            {CUSTOMER_NAV_ITEMS.map(({ id, label, to, icon: Icon, end }) => {
              const content = <>
                <span className="ae-nav__link-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="ae-nav__link-label">{label}</span>
                {id === 'notifications' && count > 0 ? (
                  <span className="ae-nav__badge" aria-label={`${count} unread notifications`}>
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </>
              return (
                <li key={id}>
                  {enabledPages.includes(id) ? (
                    <NavLink to={to} end={end} onClick={() => setOpen(false)}
                      className={({ isActive }) => `ae-nav__link${isActive ? ' is-active' : ''}`}>
                      {content}
                    </NavLink>
                  ) : (
                    <span className="ae-nav__link ae-nav__link--unavailable" aria-disabled="true"
                      title="This page is not connected yet">
                      {content}<span className="ae-nav__sr"> (not available yet)</span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ae-nav__footer">
          <button type="button" className="ae-nav__link" onClick={openSupport}
            aria-haspopup="dialog">
            <HeadsetIcon size={21} aria-hidden="true" /><span>Support</span>
          </button>
          {onSignOut ? (
            <button type="button" className="ae-nav__link" onClick={signOut}
              disabled={signingOut} aria-busy={signingOut}>
              <SignOutIcon size={21} aria-hidden="true" />
              <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          ) : null}
          {error ? <p className="ae-nav__error" role="alert">{error}</p> : null}
        </div>
      </div>
      <dialog
        ref={supportRef}
        className="ae-support"
        aria-labelledby="ae-support-title"
        onCancel={event => { event.preventDefault(); closeSupport() }}
        onClick={event => { if (event.target === event.currentTarget) closeSupport() }}
      >
        <div className="ae-support__panel">
          <header className="ae-support__head">
            <div>
              <h2 id="ae-support-title">Support</h2>
              <p>How would you like to reach us?</p>
            </div>
            <button type="button" className="ae-support__close" onClick={closeSupport}
              aria-label="Close support">
              <XIcon size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="ae-ai" role="note">
            <SparkleIcon className="ae-ai__icon" size={34} weight="fill" aria-hidden="true" />
            <div className="ae-ai__text">
              <span className="ae-ai__pill"><i aria-hidden="true" />Coming soon</span>
              <strong>Ask Al Ethijahath AI</strong>
              <span>Instant answers, right inside your portal.</span>
            </div>
          </div>

          <ul className="ae-support__list">
            <li>
              <a className="ae-support__item" href={`https://wa.me/${SUPPORT_PHONE_LINK.replace('+', '')}`}
                target="_blank" rel="noopener noreferrer">
                <span className="ae-support__icon"><WhatsappLogoIcon size={26} weight="fill" aria-hidden="true" /></span>
                <span className="ae-support__label">
                  <strong>WhatsApp</strong>
                  <span>{SUPPORT_PHONE_DISPLAY}</span>
                </span>
                <ArrowUpRightIcon className="ae-support__arrow" size={18} aria-hidden="true" />
                <span className="ae-nav__sr"> (opens WhatsApp in a new tab)</span>
              </a>
            </li>
            <li>
              <a className="ae-support__item" href={`mailto:${SUPPORT_EMAIL}`}>
                <span className="ae-support__icon"><EnvelopeSimpleIcon size={26} weight="fill" aria-hidden="true" /></span>
                <span className="ae-support__label">
                  <strong>Email</strong>
                  <span>{SUPPORT_EMAIL}</span>
                </span>
                <ArrowUpRightIcon className="ae-support__arrow" size={18} aria-hidden="true" />
              </a>
            </li>
            <li>
              <a className="ae-support__item" href={`tel:${SUPPORT_PHONE_LINK}`}>
                <span className="ae-support__icon"><PhoneCallIcon size={26} weight="fill" aria-hidden="true" /></span>
                <span className="ae-support__label">
                  <strong>Call us</strong>
                  <span>{SUPPORT_PHONE_DISPLAY}</span>
                </span>
                <ArrowUpRightIcon className="ae-support__arrow" size={18} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
      </dialog>
    </aside>
  )
}