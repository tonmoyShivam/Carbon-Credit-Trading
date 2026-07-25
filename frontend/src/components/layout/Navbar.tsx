import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-mist bg-canopy">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-semibold text-paper">
          CarbonLedger
        </Link>
        <nav className="flex items-center gap-6 text-sm text-paper/80">
          {user ? (
            <>
              <Link to="/credits" className="hover:text-credit transition-colors">Credits</Link>
              <Link to="/" className="hover:text-credit transition-colors">Dashboard</Link>
              <span className="text-paper/50">|</span>
              <span>{user.email}</span>
              <button onClick={handleLogout} className="hover:text-credit transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-credit transition-colors">Login</Link>
              <Link to="/register" className="rounded-md bg-credit px-3 py-1.5 text-canopy font-medium hover:bg-credit/90 transition-colors">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
