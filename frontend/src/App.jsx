import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import CustomerNavbar from './components/CustomerNavbar'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/navbar" element={<CustomerNavbar />} />
      </Routes>
    </BrowserRouter>
  )
}