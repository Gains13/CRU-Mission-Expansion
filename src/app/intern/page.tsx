'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Campus = { id: string; name: string; city: string | null; state: string | null }
type Prospect = {
  id: string
  campus_id: string
  full_name: string
  phone: string | null
  email: string | null
  grad_year: number | null
  followed: boolean
  survey_completed: boolean
  survey_interested_launch: boolean
  invited_to_call: boolean
  attended_call: boolean
  joined_launch_team: boolean
  registered_orientation: boolean
}

const FLAGS: [keyof Prospect, string][] = [
  ['followed', 'Followed'],
  ['survey_completed', 'Survey done'],
  ['survey_interested_launch', 'Interested'],
  ['invited_to_call', 'Invited to call'],
  ['attended_call', 'Attended call'],
  ['joined_launch_team', 'Joined launch'],
  ['registered_orientation', 'Registered'],
]

export default function InternHome() {
  const supabase = createClient()
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [name, setName] = useState('')

  useEffect(() => { loadCampuses() }, [])
  useEffect(() => { if (active) loadProspects(active) }, [active])

  async function loadCampuses() {
    const { data } = await supabase.from('campuses').select('id, name, city, state').order('name')
    if (data) {
      setCampuses(data)
      if (data[0]) setActive(data[0].id)
    }
  }

  async function loadProspects(campusId: string) {
    const { data } = await supabase.from('prospects').select('*').eq('campus_id', campusId).order('full_name')
    if (data) setProspects(data)
  }

  async function addProspect() {
    if (!name.trim() || !active) return
    const { data } = await supabase.from('prospects').insert({ campus_id: active, full_name: name.trim() }).select('*').single()
    if (data) { setProspects((p) => [...p, data]); setName('') }
  }

  async function toggle(prospect: Prospect, key: keyof Prospect) {
    const next = !prospect[key]
    setProspects((prev) => prev.map((p) => (p.id === prospect.id ? { ...p, [key]: next } : p)))
    await supabase.from('prospects').update({ [key]: next }).eq('id', prospect.id)
  }

  if (campuses.length === 0) {
    return <p className="text-sm text-neutral-600">No campuses assigned to you yet — ask your manager.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-medium">My campuses</h1>

      <div className="flex gap-2">
        {campuses.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`rounded-md border px-3 py-1.5 text-sm ${active === c.id ? 'border-accent bg-accent-100 text-accent-800' : 'border-divider text-neutral-800'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Student name"
          className="rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <button onClick={addProspect} className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100">
          + Add student
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {prospects.map((p) => (
          <div key={p.id} className="rounded-md border border-divider p-4">
            <div className="font-heading font-semibold">{p.full_name}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLAGS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggle(p, key)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${p[key] ? 'border-accent bg-accent-100 text-accent-800' : 'border-divider text-neutral-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}