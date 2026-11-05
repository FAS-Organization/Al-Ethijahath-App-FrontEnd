import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  SquaresFourIcon, TruckIcon, WrenchIcon, CalendarBlankIcon,
  FileTextIcon, ReceiptIcon, FolderOpenIcon, BellIcon,
  UserCircleIcon, HeadsetIcon, SignOutIcon, ListIcon, XIcon,
} from '@phosphor-icons/react'
import './CustomerNavbar.css'

// Frontend destinations, not Django API endpoints.
// Enable each destination only after its page is connected to your router.
export const CUSTOMER_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', to: '/dashboard', icon: SquaresFourIcon, end: true },
  { id: 'equipment', label: 'My equipment', to: '/equipment', icon: TruckIcon },
  { id: 'services', label: 'Service jobs', to: '/services', icon: WrenchIcon },
  { id: 'maintenance', label: 'AMC & service schedule', to: '/maintenance', icon: CalendarBlankIcon },
  { id: 'quotations', label: 'Quotations', to: '/quotations', icon: FileTextIcon },
  { id: 'billing', label: 'Invoices & payments', to: '/billing', icon: ReceiptIcon },
  { id: 'documents', label: 'Reports & documents', to: '/documents', icon: FolderOpenIcon },
  { id: 'notifications', label: 'Notifications', to: '/notifications', icon: BellIcon },
  { id: 'account', label: 'My account', to: '/account', icon: UserCircleIcon },
]
const INITIAL_PAGES = ['overview', 'equipment']

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
  const toggleRef = useRef(null)
  const busyRef = useRef(false)
  const menuId = useId()
  const location = useLocation()
  const [openedAt, setOpenedAt] = useState(null)
  // Route changes also close the disclosure, including browser Back/Forward.
  const expanded = open && openedAt === location.key
  const count = Number.isFinite(unreadCount) ? Math.max(0, Math.floor(unreadCount)) : 0

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

  return (
    <aside ref={rootRef} className="ae-nav" data-theme={theme} aria-label="Customer portal navigation">
      <div className="ae-nav__header">
        <NavLink className="ae-nav__brand" to="/dashboard" aria-label="Al Ethijahath customer overview"
          onClick={() => setOpen(false)}>
          <img src="/images/logo.webp" alt="Al Ethijahath" width="160" height="50" />
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
                <Icon size={21} aria-hidden="true" />
                <span>{label}</span>
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
          <a className="ae-nav__link" href="mailto:info@alethijahath.com">
            <HeadsetIcon size={21} aria-hidden="true" /><span>Contact support</span>
          </a>
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
    </aside>
  )
}
