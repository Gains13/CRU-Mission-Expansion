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

export default function CampusesPage() {
  const supabase = createClient()
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const [form, setForm] = useState({
    name: '',
    city: '',
    state: '',
    ministry: '',
    enrollment: '',
    instagram_handle: '',
    survey_link: '',
    team: '',
    contact_email: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('campuses')
      .select('id, name, city, state, instagram_handle, followers_count, surveys_sent')
      .order('name', { ascending: true })
    if (data) setCampuses(data)
    setLoading(false)
  }

  async function addCampus() {
    if (!form.name.trim()) return
    setSaving(true)

    const { error } = await supabase.from('campuses').insert({
      name: form.name.trim(),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      ministry: form.ministry.trim() || null,
      enrollment: form.enrollment ? Number(form.enrollment) : null,
      instagram_handle: form.instagram_handle.trim() || null,
      survey_link: form.survey_link.trim() || null,
      team: form.team.trim() || null,
      contact_email: form.contact_email.trim() || null,
    })

    setSaving(false)

    if (!error) {
      setForm({
        name: '',
        city: '',
        state: '',
        ministry: '',
        enrollment: '',
        instagram_handle: '',
        survey_link: '',
        team: '',
        contact_email: '',
      })
      setShowAdd(false)
      load()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium">Campuses</h1>
          <p className="mt-1 text-sm text-neutral-700">
            The master list. Click into one to set research notes, goals, and stats.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100"
        >
          {showAdd ? 'Cancel' : '+ Add campus'}
        </button>
      </div>

      {showAdd && (
        <div className="grid grid-cols-2 gap-4 rounded-md border border-divider p-5 sm:grid-cols-3">
          {[
            ['name', 'Campus name'],
            ['city', 'City'],
            ['state', 'State'],
            ['ministry', 'Existing ministries'],
            ['enrollment', 'Enrollment'],
            ['instagram_handle', 'Instagram handle'],
            ['survey_link', 'Survey link'],
            ['team', 'Team / region'],
            ['contact_email', 'Contact email'],
          ].map(([key, label]) => (
            <label key={key} className="grid gap-1.5">
              <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
                {label}
              </span>
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          ))}
          <div className="col-span-full">
            <button
              onClick={addCampus}
              disabled={saving}
              className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add campus'}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-neutral-600">Loading…</p>}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {['Campus', 'Location', 'Instagram', 'Followers', 'Surveys sent', ''].map((h) => (
              <th
                key={h}
                className="border-b border-divider pb-2 pr-3 text-left font-heading text-[11px] uppercase tracking-widest text-neutral-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!loading && campuses.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-neutral-600">
                No campuses yet — add your first one above.
              </td>
            </tr>
          )}
          {campuses.map((c) => (
            <tr key={c.id}>
              <td className="border-b border-divider py-2.5 pr-3 font-heading font-semibold">
                {c.name}
              </td>
              <td className="border-b border-divider py-2.5 pr-3 text-neutral-700">
                {[c.city, c.state].filter(Boolean).join(', ') || '—'}
              </td>
              <td className="border-b border-divider py-2.5 pr-3 text-neutral-700">
                {c.instagram_handle || '—'}
              </td>
              <td className="border-b border-divider py-2.5 pr-3 tabular-nums">
                {c.followers_count}
              </td>
              <td className="border-b border-divider py-2.5 pr-3 tabular-nums">
                {c.surveys_sent}
              </td>
              <td className="border-b border-divider py-2.5 text-right">
                <Link
                  href={`/manager/campuses/${c.id}`}
                  className="font-heading text-xs font-semibold text-accent-700 underline underline-offset-4"
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}