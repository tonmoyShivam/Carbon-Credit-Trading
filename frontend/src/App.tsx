import { Routes, Route } from 'react-router'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CreditsPage from './pages/CreditsPage'
import CreditDetailPage from './pages/CreditDetailPage'
import MarketplacePage from './pages/MarketplacePage'
import KycPage from './pages/KycPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/credits/:id" element={<CreditDetailPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/kyc" element={<KycPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
