'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CampusPasswordPanel({
  campusId,
  instagramHandle,
  followersCount,
  followingCount,
  surveysSent,
  conversationsCount,
}: {
  campusId: string
  instagramHandle: string | null
  followersCount: number
  followingCount: number
  surveysSent: number
  conversationsCount: number
}) {
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadPassword()
  }, [campusId])

  async function loadPassword() {
    setLoading(true)
    const { data } = await supabase
      .from('campus_credentials')
      .select('password')
      .eq('campus_id', campusId)
      .maybeSingle()
    if (data) setPassword(data.password)
    setLoading(false)
  }

  async function savePassword() {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('campus_credentials')
      .upsert(
        { campus_id: campusId, password, updated_by: user?.id, updated_at: new Date().toISOString() },
        { onConflict: 'campus_id' }
      )

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const stats: [string, number][] = [
    ['Followers', followersCount],
    ['Following', followingCount],
    ['Surveys sent', surveysSent],
    ['Conversations', conversationsCount],
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="grid gap-1.5">
          <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
            Instagram handle
          </span>
          <span className="text-sm">{instagramHandle || '—'}</span>
        </div>
        {stats.map(([label, value]) => (
          <div key={label} className="grid gap-1.5">
            <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
              {label}
            </span>
            <span className="text-sm tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid max-w-sm gap-1.5">
        <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
          Account password
        </span>
        {loading ? (
          <p className="text-sm text-neutral-600">Loading…</p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type={reveal ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="No password saved yet"
              className="flex-1 rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => setReveal((v) => !v)}
              className="rounded-md border border-divider px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-200"
            >
              {reveal ? 'Hide' : 'Show'}
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={savePassword}
            disabled={saving}
            className="w-fit rounded-md border border-accent px-4 py-1.5 font-heading text-xs font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save password'}
          </button>
          {saved && <span className="text-xs text-accent-800">Saved.</span>}
        </div>
      </div>
    </div>
  )
}
