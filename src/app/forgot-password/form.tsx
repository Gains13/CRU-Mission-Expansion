'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sendPasswordResetEmail } from '@/lib/password-reset'
import AuthCard from '@/components/AuthCard'
import { explainEmailError, explainLinkError } from '@/lib/auth-errors'

export default function ForgotPasswordForm({ expired, reason }: { expired: boolean; reason?: string }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await sendPasswordResetEmail(email.trim())

    setLoading(false)

    // Supabase doesn't reveal whether the email has an account, and neither
    // do we: only rate-limit, sending or network problems surface as errors.
    if (resetError) {
      setError(explainEmailError(resetError))
      return
    }
    setSent(true)
  }

  const linkProblem = expired ? explainLinkError(reason) : null

  return (
    <AuthCard title="Reset your password">
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-800">
            If an account exists for <span className="font-medium text-ink">{email.trim()}</span>, a
            reset link is on its way. It expires in an hour — check your spam folder if it
            doesn&apos;t arrive in a few minutes.
          </p>
          <Link href="/login" className="text-sm text-accent-700 underline underline-offset-4">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {linkProblem ? (
            <div className="rounded-md border border-accent-300 bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
              <span className="block font-semibold">{linkProblem.title}</span>
              <span className="mt-1 block">{linkProblem.detail}</span>
              {reason && <span className="mt-1.5 block text-xs text-neutral-600">Error code: {reason}</span>}
            </div>
          ) : (
            <p className="text-sm text-neutral-800">
              Enter the email you sign in with and we&apos;ll send you a link to choose a new
              password.
            </p>
          )}

          <label className="grid gap-1.5">
            <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
              Email
            </span>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@cru.org"
              className="w-full rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm text-ink caret-accent focus:border-accent focus:outline-none"
            />
          </label>

          {error && (
            <div className="rounded-md border border-accent-300 bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md border border-accent px-5 py-2.5 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <Link href="/login" className="text-sm text-accent-700 underline underline-offset-4">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  )
}
