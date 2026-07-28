import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { marketplaceService, type Listing, type PurchaseRequestItem } from '../services/marketplaceService'

export default function MarketplacePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [creditId, setCreditId] = useState('')
  const [askPrice, setAskPrice] = useState('')
  const [listError, setListError] = useState('')
  const [listSuccess, setListSuccess] = useState('')
  const [listingBusy, setListingBusy] = useState(false)

  const [requests, setRequests] = useState<PurchaseRequestItem[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState('')

  const load = () => {
    setLoading(true)
    marketplaceService
      .listActive()
      .then(setListings)
      .catch((err) => setError(err.response?.data?.error ?? 'Could not load listings.'))
      .finally(() => setLoading(false))
  }

  const loadRequests = () => {
    setRequestsLoading(true)
    marketplaceService
      .incomingRequests()
      .then(setRequests)
      .finally(() => setRequestsLoading(false))
  }

  useEffect(() => {
    load()
    loadRequests()
  }, [])

  const handleCreateListing = async (e: FormEvent) => {
    e.preventDefault()
    setListError('')
    setListSuccess('')
    setListingBusy(true)
    try {
      await marketplaceService.create(creditId, Number(askPrice))
      setListSuccess(`Listed ${creditId} for ${askPrice}.`)
      setCreditId('')
      setAskPrice('')
      load()
    } catch (err: any) {
      setListError(err.response?.data?.error ?? 'Could not create listing.')
    } finally {
      setListingBusy(false)
    }
  }

  const handleRequest = async (listingId: string) => {
    setActionMessage('')
    try {
      await marketplaceService.requestPurchase(listingId)
      setActionMessage('Purchase requested — waiting on the seller.')
    } catch (err: any) {
      setActionMessage(err.response?.data?.error ?? 'Request failed.')
    }
  }

  const handleCancel = async (listingId: string) => {
    setActionMessage('')
    try {
      await marketplaceService.cancel(listingId)
      load()
    } catch (err: any) {
      setActionMessage(err.response?.data?.error ?? 'Cancel failed.')
    }
  }

  const handleAccept = async (requestId: string) => {
    setActionMessage('')
    try {
      await marketplaceService.accept(requestId)
      setActionMessage('Accepted — credit transferred on-chain.')
      loadRequests()
      load()
    } catch (err: any) {
      setActionMessage(err.response?.data?.error ?? 'Accept failed.')
    }
  }

  const handleReject = async (requestId: string) => {
    setActionMessage('')
    try {
      await marketplaceService.reject(requestId)
      loadRequests()
    } catch (err: any) {
      setActionMessage(err.response?.data?.error ?? 'Reject failed.')
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-canopy">Marketplace</h1>
      <p className="mt-1 text-sm text-ink/60">Browse credits other orgs have listed for sale.</p>

      {actionMessage && (
        <div className="mt-4 rounded-md border border-mist bg-mist/20 px-3 py-2 text-sm text-canopy">
          {actionMessage}
        </div>
      )}

      <div className="mt-8 rounded-md border border-mist bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-canopy">List a credit you own</h2>
        <form onSubmit={handleCreateListing} className="mt-3 flex flex-wrap gap-2">
          {listError && (
            <div className="w-full rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {listError}
            </div>
          )}
          {listSuccess && (
            <div className="w-full rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
              {listSuccess}
            </div>
          )}
          <input
            required
            value={creditId}
            onChange={(e) => setCreditId(e.target.value)}
            placeholder="Credit ID"
            className="flex-1 min-w-[140px] rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          />
          <input
            required
            type="number"
            value={askPrice}
            onChange={(e) => setAskPrice(e.target.value)}
            placeholder="Ask price"
            className="w-32 rounded-md border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss"
          />
          <button
            type="submit"
            disabled={listingBusy}
            className="rounded-md bg-canopy px-4 py-2 text-sm font-medium text-paper hover:bg-canopy/90 transition-colors disabled:opacity-50"
          >
            {listingBusy ? 'Listing...' : 'List for sale'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-canopy">Active listings</h2>
        {loading ? (
          <p className="mt-3 text-moss">Loading...</p>
        ) : error ? (
          <p className="mt-3 text-sm text-danger">{error}</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.length ? (
              listings.map((l) => (
                <div key={l.id} className="rounded-md border border-mist bg-white p-5">
                  <p className="text-xs uppercase tracking-wide text-moss">{l.seller?.name ?? l.sellerId}</p>
                  <h3
                    className="mt-1 font-display font-semibold text-canopy cursor-pointer hover:underline"
                    onClick={() => navigate(`/credits/${l.creditId}`)}
                  >
                    {l.creditId}
                  </h3>
                  <p className="mt-1 text-sm text-ink/60">
                    {l.credit?.sourceProject} · {l.credit?.amount} units
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-xl font-semibold text-credit">${l.askPrice.toFixed(2)}</span>
                    {l.sellerId === user?.organizationId ? (
                      <button onClick={() => handleCancel(l.id)} className="text-sm text-danger hover:underline">
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequest(l.id)}
                        className="rounded-md bg-canopy px-3 py-1.5 text-sm font-medium text-paper hover:bg-canopy/90 transition-colors"
                      >
                        Request to buy
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-ink/50 col-span-full text-center py-8">No active listings.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-canopy">Requests on your listings</h2>
        {requestsLoading ? (
          <p className="mt-3 text-moss">Loading...</p>
        ) : (
          <div className="mt-3 space-y-3">
            {requests.length ? (
              requests.map((r) => (
                <div key={r.id} className="rounded-md border border-mist bg-white p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-canopy">
                      {r.buyer?.name ?? r.buyerId} wants {r.listing.creditId}
                    </p>
                    <p className="text-xs text-ink/50">
                      {r.listing.credit?.sourceProject} · ${r.listing.askPrice} · {r.status}
                    </p>
                  </div>
                  {r.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="rounded-md bg-canopy px-3 py-1.5 text-sm font-medium text-paper hover:bg-canopy/90 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="rounded-md border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-ink/50 text-center py-8">No requests yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
