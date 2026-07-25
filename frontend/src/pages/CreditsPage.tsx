import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { creditsService } from '../services/creditsService'

export default function CreditsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lookupId, setLookupId] = useState('')

  const [creditId, setCreditId] = useState('')
  const [owner, setOwner] = useState('')
  const [amount, setAmount] = useState('')
  const [sourceProject, setSourceProject] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [contentHash, setContentHash] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState('')
  const [issueSuccess, setIssueSuccess] = useState('')

  const handleLookup = (e: FormEvent) => {
    e.preventDefault()
    if (lookupId.trim()) navigate(`/credits/${lookupId.trim()}`)
  }

  const handleIssue = async (e: FormEvent) => {
    e.preventDefault()
    setIssueError('')
    setIssueSuccess('')
    setIssuing(true)
    try {
      await creditsService.issue({
        creditId,
        owner,
        amount: Number(amount),
        sourceProject,
        issueDate,
        expiryDate,
        contentHash,
      })
      setIssueSuccess(`Credit ${creditId} issued to ${owner}.`)
      setCreditId('')
      setOwner('')
      setAmount('')
      setSourceProject('')
      setIssueDate('')
      setExpiryDate('')
      setContentHash('')
    } catch (err: any) {
      setIssueError(err.response?.data?.error ?? 'Issue failed.')
    } finally {
      setIssuing(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-canopy">Credits</h1>
      <p className="mt-1 text-sm text-ink/60">There's no browsable list yet — look up a credit by its ID.</p>

      <form onSubmit={handleLookup} className="mt-6 flex gap-2">
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

      {user?.fabricRole === 'regulator' && (
        <div className="mt-10 border-t border-mist pt-6">
          <h2 className="font-display text-lg font-semibold text-canopy">Issue a new credit</h2>
          <p className="mt-1 text-sm text-ink/60">Regulator-only — the backend enforces this too.</p>

          <form onSubmit={handleIssue} className="mt-4 space-y-3">
            {issueError && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {issueError}
              </div>
            )}
            {issueSuccess && (
              <div className="rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
                {issueSuccess}
              </div>
            )}

            <input required value={creditId} onChange={(e) => setCreditId(e.target.value)} placeholder="Credit ID (e.g. credit-001)" className="w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss" />
            <input required value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner org ID (e.g. company1)" className="w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss" />
            <input required type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss" />
            <input required value={sourceProject} onChange={(e) => setSourceProject(e.target.value)} placeholder="Source project" className="w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss" />
            <div className="flex gap-3">
              <input required type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="flex-1 rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss" />
              <input required type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="flex-1 rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss" />
            </div>
            <input required value={contentHash} onChange={(e) => setContentHash(e.target.value)} placeholder="Content hash" className="w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss" />

            <button
              type="submit"
              disabled={issuing}
              className="w-full rounded-md bg-credit py-2.5 text-sm font-medium text-canopy hover:bg-credit/90 transition-colors disabled:opacity-50"
            >
              {issuing ? 'Issuing...' : 'Issue credit'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
