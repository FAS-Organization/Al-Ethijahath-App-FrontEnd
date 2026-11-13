import { useContext, useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { BellIcon, LightningIcon, MoonIcon, SunIcon } from '@phosphor-icons/react'
import { NotificationsPreviewContext } from '../data/notificationsPreviewData'
import CustomerNavbar from './CustomerNavbar'
import PortalChat from './PortalChat'

const THEME_KEY = 'ethijahath-dashboard-theme'

function initialTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export default function CustomerPortalLayout() {
  const [theme, setTheme] = useState(initialTheme)
  const notifications = useContext(NotificationsPreviewContext)?.data
  const unread = notifications?.items.filter(item => !item.read_at).length ?? 0

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Theme switching also works without storage.
    }
  }, [theme])

  return (
    <>
      <CustomerNavbar
        companyName={notifications?.company_name}
        customerName={notifications?.customer_name}
        theme={theme}
      >
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

          <button
            type="button"
            className="ed-icon-button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light'
              ? <MoonIcon size={21} aria-hidden="true" />
              : <SunIcon size={21} aria-hidden="true" />}
          </button>
        </div>
      </CustomerNavbar>

      <div className="ae-nav-content">
        <Outlet context={{ theme }} />
      </div>

      <PortalChat />
    </>
  )
}
