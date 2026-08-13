import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { kycService, type KycStatus, type PendingOrg } from '../services/kycService'

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

export default function KycPage() {
  const { user } = useAuth()

  const [status, setStatus] = useState<KycStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  const [pending, setPending] = useState<PendingOrg[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [reviewMessage, setReviewMessage] = useState('')

  const loadStatus = () => {
    setStatusLoading(true)
    kycService
      .getStatus()
      .then(setStatus)
      .finally(() => setStatusLoading(false))
  }

  const loadPending = () => {
    setPendingLoading(true)
    kycService
      .listPending()
      .then(setPending)
      .finally(() => setPendingLoading(false))
  }

  useEffect(() => {
    loadStatus()
    if (user?.fabricRole === 'regulator') loadPending()
  }, [user])

  const handleUpload = async () => {
    if (!file) return
    setUploadError('')
    setUploadSuccess('')
    setUploading(true)
    try {
      await kycService.upload(file)
      setUploadSuccess('Document uploaded — status is now Pending review.')
      setFile(null)
      loadStatus()
    } catch (err: any) {
      setUploadError(err.response?.data?.error ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleApprove = async (orgId: string) => {
    setReviewMessage('')
    try {
      await kycService.approve(orgId)
      setReviewMessage(`${orgId} approved.`)
      loadPending()
    } catch (err: any) {
      setReviewMessage(err.response?.data?.error ?? 'Approve failed.')
    }
  }

  const handleReject = async (orgId: string) => {
    setReviewMessage('')
    try {
      await kycService.reject(orgId)
      setReviewMessage(`${orgId} rejected.`)
      loadPending()
    } catch (err: any) {
      setReviewMessage(err.response?.data?.error ?? 'Reject failed.')
    }
  }

  const statusColor =
    status?.kycStatus === 'Approved' ? 'text-moss' : status?.kycStatus === 'Rejected' ? 'text-danger' : 'text-credit'

  const documentUrl = status?.kycDocumentCid ? PINATA_GATEWAY + status.kycDocumentCid : null

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-canopy">KYC</h1>
      <p className="mt-1 text-sm text-ink/60">Verification required before your organization can trade.</p>

      <div className="mt-6 rounded-md border border-mist bg-white p-5">
        <p className="text-sm text-ink/60">Your organization's status</p>
        {statusLoading ? (
          <p className="mt-1 text-moss">Loading...</p>
        ) : (
          <p className={`mt-1 font-display text-2xl font-semibold ${statusColor}`}>
            {status?.kycStatus ?? 'Unknown'}
          </p>
        )}
        {documentUrl && (
          <a
            href={documentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-moss hover:underline"
          >
            View submitted document
          </a>
        )}

        <div className="mt-5 border-t border-mist pt-4">
          <p className="text-sm font-medium text-ink">
            {status?.kycStatus === 'Approved' ? 'Submit a new document' : 'Submit a document for review'}
          </p>
          {uploadError && (
            <div className="mt-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="mt-2 rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
              {uploadSuccess}
            </div>
          )}
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 w-full text-sm text-ink/70 file:mr-3 file:rounded-md file:border-0 file:bg-mist file:px-3 file:py-1.5 file:text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-3 rounded-md bg-canopy px-4 py-2 text-sm font-medium text-paper hover:bg-canopy/90 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {user?.fabricRole === 'regulator' && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-canopy">Pending review</h2>
          {reviewMessage && (
            <div className="mt-3 rounded-md border border-mist bg-mist/20 px-3 py-2 text-sm text-canopy">
              {reviewMessage}
            </div>
          )}
          {pendingLoading ? (
            <p className="mt-3 text-moss">Loading...</p>
          ) : (
            <div className="mt-3 space-y-3">
              {pending.length ? (
                pending.map((org) => {
                  const orgDocUrl = org.kycDocumentCid ? PINATA_GATEWAY + org.kycDocumentCid : null
                  return (
                    <div key={org.id} className="rounded-md border border-mist bg-white p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-canopy">{org.name}</p>
                        <p className="text-xs text-ink/50">{org.id} · {org.role}</p>
                        {orgDocUrl && (
                            <a
                            href={orgDocUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-moss hover:underline"
                          >
                            View document
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(org.id)}
                          className="rounded-md bg-canopy px-3 py-1.5 text-sm font-medium text-paper hover:bg-canopy/90 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(org.id)}
                          className="rounded-md border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-ink/50 text-center py-8">No organizations awaiting review.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
