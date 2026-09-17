'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Campus = {
  id: string
  name: string
  city: string | null
  state: string | null
  ministry: string | null
  enrollment: number | null
  instagram_handle: string | null
  survey_link: string | null
  team: string | null
  contact_email: string | null
  research_notes: string | null
  goals_notes: string | null
  followers_count: number
  following_count: number
  surveys_sent: number
  conversations_count: number
}

export default function CampusDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [campus, setCampus] = useState<Campus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('campuses').select('*').eq('id', id).single()
    if (data) setCampus(data)
    setLoading(false)
  }

  function update<K extends keyof Campus>(key: K, value: Campus[K]) {
    setCampus((c) => (c ? { ...c, [key]: value } : c))
  }

  async function save() {
    if (!campus) return
    setSaving(true)
    const { id: _id, ...rest } = campus
    const { error } = await supabase.from('campuses').update(rest).eq('id', campus.id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  async function deleteCampus() {
    if (!campus) return
    if (!confirm(`Delete ${campus.name}? This also removes its prospects and assignments.`)) return
    await supabase.from('campuses').delete().eq('id', campus.id)
    router.push('/manager/campuses')
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>
  if (!campus) return <p className="text-sm text-neutral-600">Campus not found.</p>

  const numberField = (key: 'followers_count' | 'following_count' | 'surveys_sent' | 'conversations_count', label: string) => (
    <label className="grid gap-1.5">
      <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">{label}</span>
      <input
        type="number"
        value={campus[key]}
        onChange={(e) => update(key, Number(e.target.value) as any)}
        className="rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
    </label>
  )

  const textField = (key: 'name' | 'city' | 'state' | 'ministry' | 'instagram_handle' | 'survey_link' | 'team' | 'contact_email', label: string) => (
    <label className="grid gap-1.5">
      <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">{label}</span>
      <input
        value={campus[key] || ''}
        onChange={(e) => update(key, e.target.value as any)}
        className="rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
    </label>
  )

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/manager/campuses" className="text-sm text-accent-700 underline underline-offset-4">
          ← All campuses
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-medium">{campus.name}</h1>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {textField('name', 'Campus name')}
        {textField('city', 'City')}
        {textField('state', 'State')}
        {textField('ministry', 'Existing ministries')}
        {textField('team', 'Team / region')}
        {textField('instagram_handle', 'Instagram handle')}
        {textField('survey_link', 'Survey link')}
        {textField('contact_email', 'Contact email')}
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {numberField('followers_count', 'Followers')}
        {numberField('following_count', 'Following')}
        {numberField('surveys_sent', 'Surveys sent')}
        {numberField('conversations_count', 'Conversations')}
      </section>

      <section className="grid gap-1.5">
        <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
          Research notes
        </span>
        <textarea
          value={campus.research_notes || ''}
          onChange={(e) => update('research_notes', e.target.value)}
          rows={5}
          className="rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </section>

      <section className="grid gap-1.5">
        <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
          Goals
        </span>
        <textarea
          value={campus.goals_notes || ''}
          onChange={(e) => update('goals_notes', e.target.value)}
          rows={5}
          className="rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md border border-accent px-5 py-2.5 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-accent-800">Saved.</span>}
        <button
          onClick={deleteCampus}
          className="ml-auto text-sm text-neutral-600 underline underline-offset-4 hover:text-accent-800"
        >
          Delete campus
        </button>
      </div>
    </div>
  )
}