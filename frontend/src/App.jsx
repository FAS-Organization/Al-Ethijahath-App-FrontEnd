import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import EquipmentPage from './pages/EquipmentPage'
import QuotationsPage from './pages/QuotationsPage'
import AmcSchedulePage from './pages/AmcSchedulePage'
import ServicesPage from './pages/ServicesPage'
import InvoicesPage from './pages/InvoicesPage'
import DocumentsPage from './pages/DocumentsPage'
import AccountPage from './pages/AccountPage'
import NotificationsPage from './pages/NotificationsPage'



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignupPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/equipment" element={<EquipmentPage />} />

        <Route path="/services" element={<ServicesPage />} />

        <Route path="/quotations" element={<QuotationsPage />} />

        <Route path="/maintenance" element={<AmcSchedulePage />} />

        <Route path="/billing" element={<InvoicesPage />} />

        <Route path="/documents" element={<DocumentsPage />} />
        
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route path="/account" element={<AccountPage />} />

      </Routes>
    </BrowserRouter>
  )
}