import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="text-center py-24">
      <p className="font-display text-6xl font-semibold text-canopy">404</p>
      <p className="mt-2 text-ink/60">This page doesn't exist.</p>
      <Link to="/" className="mt-4 inline-block text-moss font-medium hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}
