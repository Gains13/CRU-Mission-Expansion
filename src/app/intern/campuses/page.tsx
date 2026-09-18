'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Campus = {
  id: string
  name: string
  city: string | null
  state: string | null
  instagram_handle: string | null
  followers_count: number
  surveys_sent: number
}

export default function InternCampusesPage() {
  const supabase = createClient()
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('campuses')
      .select('id, name, city, state, instagram_handle, followers_count, surveys_sent')
      .order('name')
    if (data) setCampuses(data)
    setLoading(false)
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Campus workspace</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Goals, account info, and the Instagram review tool for each of your campuses.
        </p>
      </div>

      {campuses.length === 0 && (
        <p className="text-sm text-neutral-600">No campuses assigned to you yet — ask your manager.</p>
      )}

      <div className="flex flex-col gap-3">
        {campuses.map((c) => (
          <Link
            key={c.id}
            href={`/intern/campuses/${c.id}`}
            className="flex items-center justify-between rounded-md border border-divider p-4 hover:border-accent-300"
          >
            <div>
              <div className="font-heading font-semibold">{c.name}</div>
              <div className="text-sm text-neutral-600">
                {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                {c.instagram_handle ? ` · ${c.instagram_handle}` : ''}
              </div>
            </div>
            <div className="text-sm text-neutral-700 tabular-nums">
              {c.followers_count} followers · {c.surveys_sent} surveys
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
