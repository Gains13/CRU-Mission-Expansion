'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MIN_PASSWORD_LENGTH } from '@/lib/password-reset'
import AuthCard from '@/components/AuthCard'

// Reached from /auth/confirm, which has already signed the user in using the
// link in their reset email. Here they choose the new password.
export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [status, setStatus] = useState<'checking' | 'ready' | 'no-session'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser()
      setStatus(data.user ? 'ready' : 'no-session')
    }
    check()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('The two passwords don’t match.')
      return
    }

    setSaving(true)
    const { data, error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError || !data.user) {
      setSaving(false)
      setError(updateError?.message ?? 'Could not update your password.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.replace(profile?.role ? `/${profile.role}` : '/login')
  }

  if (status === 'checking') {
    return (
      <AuthCard title="Choose a new password">
        <p className="text-sm text-neutral-600">Checking your reset link…</p>
      </AuthCard>
    )
  }

  if (status === 'no-session') {
    return (
      <AuthCard title="Choose a new password">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-800">
            This page needs a valid reset link. It may have expired or already been used.
          </p>
          <Link href="/forgot-password" className="text-sm text-accent-700 underline underline-offset-4">
            Request a new reset link
          </Link>
        </div>
      </AuthCard>
    )
  }

  const inputClass =
    'w-full rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm text-ink caret-accent focus:border-accent focus:outline-none'

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="grid gap-1.5">
          <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
            New password
          </span>
          <input
            type="password"
            required
            autoFocus
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-neutral-600">At least {MIN_PASSWORD_LENGTH} characters.</span>
        </label>

        <label className="grid gap-1.5">
          <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
            Confirm new password
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && (
          <div className="rounded-md border border-accent-300 bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md border border-accent px-5 py-2.5 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save new password'}
          </button>
        </div>
      </form>
    </AuthCard>
  )
}
