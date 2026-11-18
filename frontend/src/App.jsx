
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'

import { useEffect, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorPage, { ErrorPreviewPage } from './components/ErrorPage'
import CustomerPortalLayout from './components/CustomerPortalLayout'

import NotificationsPage from './pages/NotificationsPage'
import {
  createNotificationsPreviewData,
  NotificationsPreviewContext,
} from './data/notificationsPreviewData'

import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import EquipmentPage from './pages/EquipmentPage'
import QuotationsPage from './pages/QuotationsPage'
import AmcSchedulePage from './pages/AmcSchedulePage'
import ServicesPage from './pages/ServicesPage'
import InvoicesPage from './pages/InvoicesPage'
import ExtraServicesPage from './pages/ExtraServicesPage'
import DocumentsPage from './pages/DocumentsPage'
import AccountPage from './pages/AccountPage'


const THEME_KEY = 'ethijahath-dashboard-theme'

function initialTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function AppRoutes() {
  const location = useLocation()
  const [theme, setTheme] = useState(initialTheme)

  function toggleTheme() {
    setTheme(current => current === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Theme switching also works without storage.
    }
  }, [theme])

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<SignupPage theme={theme} onToggleTheme={toggleTheme} />} />

        <Route element={<CustomerPortalLayout theme={theme} onToggleTheme={toggleTheme} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/quotations" element={<QuotationsPage />} />
          <Route path="/maintenance" element={<AmcSchedulePage />} />
          <Route path="/billing" element={<InvoicesPage />} />
          <Route path="/extras" element={<ExtraServicesPage />} />    
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        {/* Preview any error page */}
        <Route
          path="/error/:type"
          element={<ErrorPreviewPage />}
        />

        {/* Any other address */}
        <Route
          path="*"
          element={<ErrorPage type="not_found" />}
        />
      </Routes>
    </ErrorBoundary>
  )
}


export default function App() {
  const [notificationData, setNotificationData] = useState(
    createNotificationsPreviewData,
  )

  return (
    <NotificationsPreviewContext.Provider
      value={{
        data: notificationData,
        setData: setNotificationData,
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </NotificationsPreviewContext.Provider>
  )
}
