import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { creditsService } from '../services/creditsService'

interface HeldCredit {
  creditId: string
  amount: number
  sourceProject: string
  status: string
  verificationStatus: string
  issueDate: string
  expiryDate: string
  owner: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [credits, setCredits] = useState<HeldCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lookupId, setLookupId] = useState('')

  useEffect(() => {
    if (!user) return
    creditsService
      .getBalance(user.organizationId)
      .then((data) => setCredits(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.error ?? 'Could not load your credits.'))
      .finally(() => setLoading(false))
  }, [user])

  const handleLookup = (e: FormEvent) => {
    e.preventDefault()
    if (lookupId.trim()) navigate(`/credits/${lookupId.trim()}`)
  }

  const totalAmount = credits.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-canopy">
        Welcome back{user ? `, ${user.email}` : ''}
      </h1>
      <p className="mt-1 text-sm text-ink/60">{user?.organizationId} · {user?.fabricRole}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
        <div className="rounded-md border border-mist bg-white px-5 py-4">
          <p className="text-sm text-ink/60">Credits held</p>
          <p className="mt-1 font-display text-3xl font-semibold text-canopy">{credits.length}</p>
        </div>
        <div className="rounded-md border border-mist bg-white px-5 py-4">
          <p className="text-sm text-ink/60">Total amount</p>
          <p className="mt-1 font-display text-3xl font-semibold text-canopy">{totalAmount}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-canopy">Your credits</h2>
        {loading ? (
          <p className="mt-3 text-moss">Loading...</p>
        ) : error ? (
          <p className="mt-3 text-sm text-danger">{error}</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-md border border-mist">
            <table className="w-full text-sm">
              <thead className="bg-mist/40 text-left text-ink/60">
                <tr>
                  <th className="px-4 py-2 font-medium">Credit ID</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Source project</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {credits.length ? (
                  credits.map((c) => (
                    <tr
                      key={c.creditId}
                      onClick={() => navigate(`/credits/${c.creditId}`)}
                      className="border-t border-mist hover:bg-mist/20 cursor-pointer"
                    >
                      <td className="px-4 py-2 text-canopy font-medium">{c.creditId}</td>
                      <td className="px-4 py-2">{c.amount}</td>
                      <td className="px-4 py-2">{c.sourceProject}</td>
                      <td className="px-4 py-2">{c.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-ink/50">
                      No credits held yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 max-w-sm">
        <h2 className="font-display text-lg font-semibold text-canopy">Look up any credit</h2>
        <form onSubmit={handleLookup} className="mt-3 flex gap-2">
          <input
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="Credit ID"
            className="flex-1 rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          />
          <button
            type="submit"
            className="rounded-md bg-canopy px-4 py-2 text-sm font-medium text-paper hover:bg-canopy/90 transition-colors"
          >
            View
          </button>
        </form>
      </div>

      {user?.fabricRole === 'regulator' && (
        <div className="mt-8">
          <Link
            to="/credits"
            className="inline-block rounded-md bg-credit px-4 py-2 text-sm font-medium text-canopy hover:bg-credit/90 transition-colors"
          >
            Issue a new credit →
          </Link>
        </div>
      )}
    </div>
  )
}
