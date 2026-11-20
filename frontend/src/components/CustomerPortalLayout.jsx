import { useContext, useLayoutEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BellIcon, LightningIcon } from '@phosphor-icons/react'
import { NotificationsPreviewContext } from '../data/notificationsPreviewData'
import CustomerNavbar from './CustomerNavbar'
import PortalChat from './PortalChat'
import PortalThemeToggle from './PortalThemeToggle'

export default function CustomerPortalLayout({ theme, onToggleTheme, serviceOnly = false, onSignOut }) {
  const { pathname } = useLocation()
  const scrollPositions = useRef(new Map())

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  useLayoutEffect(() => {
    const top = scrollPositions.current.get(pathname) ?? 0
    window.scrollTo({ top, left: 0, behavior: 'instant' })

    function rememberScroll() {
      scrollPositions.current.set(pathname, window.scrollY)
    }

    window.addEventListener('scroll', rememberScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', rememberScroll)
    }
  }, [pathname])
  const notifications = useContext(NotificationsPreviewContext)?.data
  const unread = notifications?.items.filter(item => !item.read_at).length ?? 0

  return (
    <>
      <CustomerNavbar
        companyName={notifications?.company_name}
        customerName={notifications?.customer_name}
        theme={theme}
        enabledPages={serviceOnly ? ['services'] : undefined}
        serviceOnly={serviceOnly}
        onSignOut={onSignOut}
      >
        <div className="ed-top-actions" inert={serviceOnly}>
          <a
            className="ed-dispatch"
            href="https://www.alethijahath.com/#dispatch-form"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LightningIcon size={17} weight="fill" aria-hidden="true" />
            <span className="ed-dispatch-label">
              <span>Emergency</span>{' '}
              <span className="ed-dispatch-second-line">dispatch</span>
            </span>
            <span className="ed-sr-only"> (opens in a new tab)</span>
          </a>

          <Link
            className="ed-icon-button"
            to="/notifications"
            aria-label={`Notifications, ${unread} unread`}
          >
            <BellIcon size={21} aria-hidden="true" />
            {unread > 0 && (
              <span className="ed-notification-count">{unread > 99 ? '99+' : unread}</span>
            )}
          </Link>

          <PortalThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        </div>
      </CustomerNavbar>

      <div className="ae-nav-content">
        <Outlet context={{ theme }} />
      </div>

      {!serviceOnly && <PortalChat />}
    </>
  )
}
