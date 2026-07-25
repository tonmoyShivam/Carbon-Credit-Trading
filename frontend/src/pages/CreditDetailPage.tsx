import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import { creditsService } from '../services/creditsService'

interface CreditSnapshot {
  creditId: string
  owner: string
  amount: number
  sourceProject: string
  verificationStatus: string
  issueDate: string
  expiryDate: string
  status: string
  contentHash: string
}

interface HistoryEntry {
  txId: string
  timestamp: { seconds: number; nanos: number }
  isDelete: boolean
  value: CreditSnapshot
}

export default function CreditDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [credit, setCredit] = useState<CreditSnapshot | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [newOwner, setNewOwner] = useState('')
  const [price, setPrice] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [retiring, setRetiring] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    setLoadError('')
    Promise.all([creditsService.verify(id), creditsService.getHistory(id)])
      .then(([v, h]) => {
        setCredit(v as CreditSnapshot)
        setHistory(Array.isArray(h) ? h : [])
      })
      .catch((err) => setLoadError(err.response?.data?.error ?? 'Could not load this credit.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleTransfer = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    setActionError('')
    setActionSuccess('')
    setTransferring(true)
    try {
      await creditsService.transfer(id, newOwner, Number(price))
      setActionSuccess(`Transferred to ${newOwner}.`)
      setNewOwner('')
      setPrice('')
      load()
    } catch (err: any) {
      setActionError(err.response?.data?.error ?? 'Transfer failed.')
    } finally {
      setTransferring(false)
    }
  }

  const handleRetire = async () => {
    if (!id) return
    setActionError('')
    setActionSuccess('')
    setRetiring(true)
    try {
      await creditsService.retire(id)
      setActionSuccess('Credit retired.')
      load()
    } catch (err: any) {
      setActionError(err.response?.data?.error ?? 'Retire failed.')
    } finally {
      setRetiring(false)
    }
  }

  if (loading) return <p className="text-moss">Loading credit...</p>

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(-1)} className="text-sm text-moss hover:underline">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl font-semibold text-canopy">{id}</h1>

      {loadError && (
        <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {loadError}
        </div>
      )}

      {credit && (
        <div className="mt-6 rounded-md border border-mist bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">Verification</p>
            <span className="rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-medium text-moss">
              {credit.verificationStatus}
            </span>
          </div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Owner" value={credit.owner} />
            <Row label="Amount" value={String(credit.amount)} />
            <Row label="Source project" value={credit.sourceProject} />
            <Row label="Status" value={credit.status} />
            <Row label="Issued" value={credit.issueDate} />
            <Row label="Expires" value={credit.expiryDate} />
            <Row label="Content hash" value={credit.contentHash} mono />
          </dl>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-display text-lg font-semibold text-canopy">History</h2>
        <ul className="mt-3 space-y-3">
          {history.length ? (
            history.map((h) => (
              <li key={h.txId} className="rounded-md border border-mist bg-white p-4">
                <p className="text-xs text-ink/50">
                  {new Date(h.timestamp.seconds * 1000).toLocaleString()}
                </p>
                <p className="mt-1 text-sm font-medium text-canopy">
                  {h.value.status} · {h.value.amount} units · owner {h.value.owner}
                </p>
                <p className="mt-1 text-xs text-ink/40 break-all">{h.txId}</p>
              </li>
            ))
          ) : (
            <p className="text-sm text-ink/50">No history yet.</p>
          )}
        </ul>
      </div>

      {actionError && (
        <div className="mt-6 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="mt-6 rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
          {actionSuccess}
        </div>
      )}

      <div className="mt-6 rounded-md border border-mist bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-canopy">Transfer</h2>
        <form onSubmit={handleTransfer} className="mt-3 space-y-3">
          <input
            required
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            placeholder="New owner org ID (e.g. company2)"
            className="w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          />
          <input
            required
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          />
          <button
            type="submit"
            disabled={transferring}
            className="w-full rounded-md bg-canopy py-2.5 text-sm font-medium text-paper hover:bg-canopy/90 transition-colors disabled:opacity-50"
          >
            {transferring ? 'Transferring...' : 'Transfer'}
          </button>
        </form>
      </div>

      <div className="mt-4">
        <button
          onClick={handleRetire}
          disabled={retiring}
          className="w-full rounded-md border border-danger/40 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
        >
          {retiring ? 'Retiring...' : 'Retire this credit'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/60 shrink-0">{label}</dt>
      <dd className={`text-right ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</dd>
    </div>
  )
}
