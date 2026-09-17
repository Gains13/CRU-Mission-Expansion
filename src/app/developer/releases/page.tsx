'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Release = {
  id: string
  version: string
  note: string
  environment: 'preview' | 'production'
  created_at: string
}

export default function ReleasesPage() {
  const supabase = createClient()
  const [releases, setReleases] = useState<Release[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('releases')
      .select('id, version, note, environment, created_at')
      .order('created_at', { ascending: false })
    if (data) setReleases(data)
    setLoading(false)
  }

  function bumpVersion(latest: string | undefined) {
    if (!latest) return 'v0.1.0'
    const [major, minor] = latest.replace('v', '').split('.').map(Number)
    return `v${major}.${minor + 1}.0`
  }

  async function cutRelease() {
    if (!note.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const version = bumpVersion(releases[0]?.version)

    const { data, error } = await supabase
      .from('releases')
      .insert({ version, note: note.trim(), environment: 'preview', deployed_by: user?.id })
      .select('id, version, note, environment, created_at')
      .single()

    if (!error && data) {
      setReleases((prev) => [data, ...prev])
      setNote('')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-medium">Releases</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What shipped?"
          className="min-w-56 flex-1 rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <button
          onClick={cutRelease}
          className="rounded-md border border-accent px-4 py-2.5 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100"
        >
          Cut release
        </button>
      </div>

      {loading && <p className="text-sm text-neutral-600">Loading…</p>}

      <div className="flex flex-col">
        {releases.map((rel) => (
          <div
            key={rel.id}
            className="grid grid-cols-[86px_1fr_auto] items-baseline gap-4 border-b border-divider py-3.5"
          >
            <span className="font-heading text-sm font-semibold tabular-nums">
              {rel.version}
            </span>
            <span className="text-sm">
              {rel.note}
              <br />
              <span className="text-xs text-neutral-600">
                {new Date(rel.created_at).toLocaleDateString()}
              </span>
            </span>
            <span
              className={`inline-flex whitespace-nowrap rounded px-2.5 py-0.5 text-xs ${
                rel.environment === 'production'
                  ? 'bg-accent-100 text-accent-800'
                  : 'bg-neutral-200 text-neutral-800'
              }`}
            >
              {rel.environment === 'production' ? 'Production' : 'Preview'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}