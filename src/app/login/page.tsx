'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    if (profileError || !profile) {
      setError('Could not load your profile.')
      return
    }

    router.push(`/${profile.role}`)
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
          One structured pipeline from campus research to the students who could
          help launch a movement — replacing the spreadsheets, the Instagram
          inbox and the survey exports that currently live apart.
        </p>
        <div className="grid max-w-md gap-2.5">
          {[
            'Research campuses with no Cru presence',
            'Find, follow and talk with students',
            'Survey, invite to an info call, track who says yes',
          ].map((step, i) => (
            <div key={step}>
              <div className="grid grid-cols-[20px_1fr] items-baseline gap-2.5">
                <span className="font-heading text-xs text-accent tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-neutral-800">{step}</span>
              </div>
              {i < 2 && <div className="mt-2.5 h-px bg-divider" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center gap-5 px-8 py-14 md:px-12">
        <div className="w-full max-w-md">
          <h2 className="mb-4 font-heading text-2xl font-medium">Sign in</h2>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
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

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md border border-accent px-5 py-2.5 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <Link href="/signup" className="text-sm text-accent-700 underline underline-offset-4">
                Have an invite code? Create an account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}