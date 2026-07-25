import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

const ORGANIZATIONS = [
  { id: 'company1', label: 'Company One', role: 'company' },
  { id: 'company2', label: 'Company Two', role: 'company' },
  { id: 'CarbonAuthority', label: 'Carbon Authority (Regulator)', role: 'regulator' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationId, setOrganizationId] = useState(ORGANIZATIONS[0].id)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const org = ORGANIZATIONS.find((o) => o.id === organizationId)!
      await register({ email, password, organizationId, fabricRole: org.role })
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="font-display text-2xl font-semibold text-canopy">Create account</h1>
      <p className="mt-1 text-sm text-ink/60">Register a user under an existing organization.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink">Organization</label>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="mt-1 w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          >
            {ORGANIZATIONS.map((org) => (
              <option key={org.id} value={org.id}>
                {org.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-canopy py-2.5 text-sm font-medium text-paper hover:bg-canopy/90 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
