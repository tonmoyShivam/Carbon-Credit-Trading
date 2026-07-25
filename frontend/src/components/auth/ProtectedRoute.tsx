import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { token, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-moss">Loading...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
