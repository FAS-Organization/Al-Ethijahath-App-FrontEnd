
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useEffect, useRef, useState } from 'react'
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
  const navigate = useNavigate()
  const [theme, setTheme] = useState(initialTheme)
  const [serviceUsers, setServiceUsers] = useState([])
  const [previewLogin, setPreviewLogin] = useState(null)
  const demoPasswords = useRef(new Map())

  function saveServiceUser({ email, password }, previousEmail = null) {
    const login = email.trim().toLowerCase()

    if (login !== previousEmail && demoPasswords.current.has(login)) {
      throw new Error('This email already has a demo login.')
    }

    if (previousEmail && previousEmail !== login) demoPasswords.current.delete(previousEmail)
    demoPasswords.current.set(login, password)
    setServiceUsers(current => (
      previousEmail
        ? current.map(user => user.email === previousEmail ? { ...user, email: login } : user)
        : [...current, { email: login, isEnabled: true }]
    ))
  }

  function toggleServiceUser(email, isEnabled) {
    setServiceUsers(current => current.map(user =>
      user.email === email ? { ...user, isEnabled } : user,
    ))
  }

  function handleLogin({ email, password }) {
    const login = email.trim().toLowerCase()
    const user = serviceUsers.find(item => item.email === login)
    if (!user || demoPasswords.current.get(login) !== password) {
      throw new Error('Enter the demo email and password created in Account Sharing.')
    }
    if (!user.isEnabled) throw new Error('Service access for this demo login is disabled.')

    setPreviewLogin(user.email)
    navigate('/services', { replace: true })
  }

  function handleSignOut() {
    setPreviewLogin(null)
    navigate('/', { replace: true })
  }

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

  if (previewLogin) {
    return (
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route element={
            <CustomerPortalLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              serviceOnly
              onSignOut={handleSignOut}
            />
          }>
            <Route path="/services" element={<ServicesPage serviceOnly />} />
          </Route>
          <Route path="*" element={<Navigate to="/services" replace />} />
        </Routes>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<SignupPage theme={theme} onToggleTheme={toggleTheme} onLogin={handleLogin} />} />

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
          <Route path="/account" element={
            <AccountPage
              serviceUsers={serviceUsers}
              onSaveServiceUser={saveServiceUser}
              getDemoPassword={email => demoPasswords.current.get(email) ?? ''}
              onToggleServiceUser={toggleServiceUser}
            />
          } />
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
