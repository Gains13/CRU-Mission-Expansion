'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Intern = {
  id: string
  email: string
  full_name: string | null
}

type Campus = {
  id: string
  name: string
}

type Assignment = {
  id: string
  campus_id: string
  intern_id: string
}

export default function InternsPage() {
  const supabase = createClient()
  const [interns, setInterns] = useState<Intern[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')

  const [pickCampus, setPickCampus] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
  }, [])

  function say(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function load() {
    setLoading(true)
    const [{ data: accounts }, { data: campusRows }, { data: assignRows }] = await Promise.all([
      supabase.rpc('list_accounts'),
      supabase.from('campuses').select('id, name').order('name'),
      supabase.from('campus_assignments').select('id, campus_id, intern_id'),
    ])
    if (accounts) setInterns(accounts.filter((a: any) => a.role === 'intern'))
    if (campusRows) setCampuses(campusRows)
    if (assignRows) setAssignments(assignRows)
    setLoading(false)
  }

  async function sendInviteEmail() {
    if (!inviteEmail.trim()) {
      say('Enter an email first.')
      return
    }
    setSending(true)
    const res = await fetch('/api/admin/invite-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: 'intern' }),
    })
    const json = await res.json()
    setSending(false)

    if (!res.ok) {
      say('Could not send invite: ' + json.error)
      return
    }
    say(`Invite sent to ${inviteEmail}`)
    setInviteEmail('')
  }

  async function generateCode() {
    const { data, error } = await supabase.rpc('generate_invite', { p_role: 'intern' })
    if (error) {
      say('Could not generate code: ' + error.message)
      return
    }
    setGeneratedCode(data)
  }

  function campusesFor(internId: string) {
    const ids = assignments.filter((a) => a.intern_id === internId).map((a) => a.campus_id)
    return campuses.filter((c) => ids.includes(c.id))
  }

  function unassignedCampusesFor(internId: string) {
    const ids = assignments.filter((a) => a.intern_id === internId).map((a) => a.campus_id)
    return campuses.filter((c) => !ids.includes(c.id))
  }

  async function assignCampus(internId: string) {
    const campusId = pickCampus[internId]
    if (!campusId) return

    const { data, error } = await supabase
      .from('campus_assignments')
      .insert({ campus_id: campusId, intern_id: internId })
      .select('id, campus_id, intern_id')
      .single()

    if (!error && data) {
      setAssignments((prev) => [...prev, data])
      setPickCampus((prev) => ({ ...prev, [internId]: '' }))
    }
  }

  async function unassignCampus(assignmentId: string) {
    await supabase.from('campus_assignments').delete().eq('id', assignmentId)
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-2xl font-medium">Interns</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Bring people on, then hand each one the campuses they own.
        </p>
      </div>

      {/* Invite panel */}
      <section className="flex flex-wrap items-end gap-3 rounded-md border border-divider p-5">
        <div className="grid gap-1.5">
          <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">
            Email
          </span>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="newintern@cru.org"
            className="w-64 rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <button
          onClick={sendInviteEmail}
          disabled={sending}
          className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send invite email'}
        </button>
        <span className="text-sm text-neutral-600">or</span>
        <button
          onClick={generateCode}
          className="rounded-md border border-divider px-4 py-2 font-heading text-sm font-semibold text-neutral-800 hover:bg-neutral-200"
        >
          Generate a code instead
        </button>
        {generatedCode && (
          <span className="rounded-md border border-accent-300 bg-accent-100 px-3 py-2 text-sm text-accent-800">
            Code: <span className="font-heading font-semibold">{generatedCode}</span>
          </span>
        )}
      </section>

      {loading && <p className="text-sm text-neutral-600">Loading…</p>}

      {!loading && interns.length === 0 && (
        <p className="text-sm text-neutral-600">No interns yet — invite your first one above.</p>
      )}

      <div className="flex flex-col gap-5">
        {interns.map((intern) => {
          const assigned = campusesFor(intern.id)
          const unassigned = unassignedCampusesFor(intern.id)
          const internAssignments = assignments.filter((a) => a.intern_id === intern.id)

          return (
            <div key={intern.id} className="rounded-md border border-divider p-5">
              <div className="font-heading text-lg font-semibold">
                {intern.full_name || '—'}
              </div>
              <div className="text-sm text-neutral-600">{intern.email}</div>

              <div className="mt-4 flex flex-wrap gap-2">
                {assigned.length === 0 && (
                  <span className="text-sm text-neutral-600">No campuses assigned yet.</span>
                )}
                {assigned.map((c) => {
                  const assignment = internAssignments.find((a) => a.campus_id === c.id)!
                  return (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-2 rounded-md border border-accent-300 bg-accent-100 px-2.5 py-1 text-xs text-accent-800"
                    >
                      {c.name}
                      <button
                        onClick={() => unassignCampus(assignment.id)}
                        className="text-accent-700 hover:text-accent-900"
                        title="Unassign"
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <select
                  value={pickCampus[intern.id] || ''}
                  onChange={(e) =>
                    setPickCampus((prev) => ({ ...prev, [intern.id]: e.target.value }))
                  }
                  className="rounded-md border border-divider bg-transparent px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">Assign a campus…</option>
                  {unassigned.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => assignCampus(intern.id)}
                  className="rounded-md border border-divider px-3 py-1.5 font-heading text-xs font-semibold text-neutral-800 hover:bg-neutral-200"
                >
                  Assign
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md border border-accent-300 bg-accent-100 px-4 py-2.5 text-sm text-accent-800 shadow-md">
          {toast}
        </div>
      )}
    </div>
  )
}