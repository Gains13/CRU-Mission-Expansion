'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [inviteCode, setInviteCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    // 1. Validate the invite code BEFORE creating an account with it
    const { data: role, error: inviteCheckError } = await supabase.rpc(
      'get_invite_role',
      { p_code: inviteCode.trim() }
    )

    if (inviteCheckError || !role) {
      setError('That invite code is invalid, expired, or already used.')
      setLoading(false)
      return
    }

    // 2. Create the auth user (trigger auto-creates a `profiles` row)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Something went wrong creating your account.')
      setLoading(false)
      return
    }

    // 3. Consume the invite code and assign the real role
    const { data: assignedRole, error: redeemError } = await supabase.rpc(
      'redeem_invite',
      { p_code: inviteCode.trim(), p_user_id: data.user.id }
    )

    setLoading(false)

    if (redeemError || !assignedRole) {
      setError(
        'Account created, but the invite code could not be applied. Contact an admin.'
      )
      return
    }

    if (!data.session) {
      setMessage('Account created! Check your email to confirm before signing in.')
      return
    }

    router.push(`/${assignedRole}`)
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      <div className="hidden md:flex flex-col justify-center gap-7 border-r border-divider px-12 py-14">
        <div className="font-heading text-xs uppercase tracking-widest text-accent">
          Mission Expansion
        </div>
        <h1 className="font-heading text-5xl leading-tight tracking-tight">
          Cru Mission
          <br />
          Expansion Launch
        </h1>
        <div className="h-px w-16 bg-accent" />
        <p className="max-w-md text-neutral-800">
          Accounts are invite-only. If you were given a code by a manager or
          developer, enter it below to set up your access.
        </p>
      </div>

      <div className="flex flex-col justify-center gap-5 px-8 py-14 md:px-12">
        <div className="w-full max-w-md">
          <h2 className="mb-4 font-heading text-2xl font-medium">Create account</h2>

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <label className="grid gap-1.5">
              <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
                Invite code
              </span>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. INT-2026-001"
                className="w-full rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm text-ink caret-accent focus:border-accent focus:outline-none"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
                Full name
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Pryce"
                className="w-full rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm text-ink caret-accent focus:border-accent focus:outline-none"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@cru.org"
                className="w-full rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm text-ink caret-accent focus:border-accent focus:outline-none"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm text-ink caret-accent focus:border-accent focus:outline-none"
              />
            </label>

            {error && (
              <div className="rounded-md border border-accent-300 bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-md border border-accent-300 bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
                {message}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md border border-accent px-5 py-2.5 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
              <Link href="/login" className="text-sm text-accent-700 underline underline-offset-4">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}