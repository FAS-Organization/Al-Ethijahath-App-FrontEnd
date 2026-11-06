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
      </Routes>
    </BrowserRouter>
  )
}