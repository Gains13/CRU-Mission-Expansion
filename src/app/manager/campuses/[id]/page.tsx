'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { affiliationShort, formatDate, parseResearch } from '@/lib/research-format'
import { Stat } from '@/components/research/ReportView'

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
  note: string | null
  research_notes: string | null
  goals_notes: string | null
  followers_count: number
  following_count: number
  surveys_sent: number
  conversations_count: number
}

// Only these fields are written when saving edits (so a save never
// overwrites research results saved from the Research tab meanwhile).
const EDITABLE = [
  'name', 'city', 'state', 'ministry', 'enrollment', 'instagram_handle', 'survey_link', 'team',
  'contact_email', 'note', 'goals_notes', 'followers_count', 'following_count', 'surveys_sent',
  'conversations_count',
] as const

type Account = { id: string; email: string; full_name: string | null; role: string }
type Review = { id: string; handle: string; decision: 'added' | 'skipped'; created_at: string; intern_id: string }
type Task = { id: string; title: string; status: string; due_date: string | null; intern_id: string | null }
type Prospect = {
  id: string
  full_name: string
  instagram_handle: string | null
  found_by: string | null
  created_at: string
  followed: boolean
  survey_completed: boolean
  survey_interested_launch: boolean
  invited_to_call: boolean
  attended_call: boolean
  joined_launch_team: boolean
  registered_orientation: boolean
}

const STAGES: [keyof Prospect, string][] = [
  ['registered_orientation', 'Registered'],
  ['joined_launch_team', 'Joined launch team'],
  ['attended_call', 'Attended call'],
  ['invited_to_call', 'Invited to call'],
  ['survey_interested_launch', 'Interested'],
  ['survey_completed', 'Survey done'],
  ['followed', 'Followed'],
]

function stageOf(p: Prospect) {
  return STAGES.find(([k]) => p[k])?.[1] ?? 'Found'
}

function instagramUrl(handle: string) {
  return `https://www.instagram.com/${handle.trim().replace(/^@/, '')}/`
}

function withScheme(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export default function CampusDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [campus, setCampus] = useState<Campus | null>(null)
  const [draft, setDraft] = useState<Campus | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    async function load() {
      const [c, cred, acc, asg, rev, tsk, pro] = await Promise.all([
        supabase.from('campuses').select('*').eq('id', id).single(),
        supabase.from('campus_credentials').select('password').eq('campus_id', id).maybeSingle(),
        supabase.rpc('list_accounts'),
        supabase.from('campus_assignments').select('intern_id').eq('campus_id', id),
        supabase.from('instagram_review_log').select('id, handle, decision, created_at, intern_id').eq('campus_id', id).order('created_at', { ascending: false }).limit(500),
        supabase.from('goals_tasks').select('id, title, status, due_date, intern_id').eq('campus_id', id).order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('prospects').select('id, full_name, instagram_handle, found_by, created_at, followed, survey_completed, survey_interested_launch, invited_to_call, attended_call, joined_launch_team, registered_orientation').eq('campus_id', id).order('created_at', { ascending: false }),
      ])
      if (c.data) setCampus(c.data)
      setPassword(cred.data?.password ?? null)
      if (acc.data) setAccounts(acc.data as Account[])
      setAssignedIds((asg.data ?? []).map((a) => a.intern_id))
      setReviews((rev.data ?? []) as Review[])
      setTasks((tsk.data ?? []) as Task[])
      setProspects((pro.data ?? []) as Prospect[])
      setLoading(false)
    }
    load()
  }, [id, supabase])

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>
  if (!campus) return <p className="text-sm text-neutral-600">Campus not found.</p>

  const nameOf = (userId: string | null) => {
    const a = accounts.find((x) => x.id === userId)
    return a ? a.full_name || a.email : 'Unknown'
  }
  const handle = campus.instagram_handle?.trim().replace(/^@/, '') || null
  const research = parseResearch(campus.research_notes)
  const added = reviews.filter((r) => r.decision === 'added').length
  const lastActivity = [reviews[0]?.created_at, prospects[0]?.created_at].filter(Boolean).sort().pop()
  const openTasks = tasks.filter((t) => t.status !== 'done')

  function startEdit() {
    setDraft(campus)
    setEditing(true)
    setNotice('')
  }

  async function save() {
    if (!draft) return
    setSaving(true)
    const changes = Object.fromEntries(EDITABLE.map((k) => [k, draft[k]]))
    const { error } = await supabase.from('campuses').update(changes).eq('id', draft.id)
    setSaving(false)
    if (error) {
      setNotice(`Couldn’t save: ${error.message}`)
      return
    }
    setCampus(draft)
    setEditing(false)
    setNotice('Saved.')
  }

  async function deleteCampus() {
    if (!campus) return
    if (!confirm(`Delete ${campus.name}? This also removes its prospects, tasks and Instagram review history.`)) return
    await supabase.from('campuses').delete().eq('id', campus.id)
    router.push('/manager/campuses')
  }

  async function copyPassword() {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setNotice('Password copied.')
    } catch {
      setNotice('Couldn’t copy — select it and copy instead.')
    }
  }

  if (editing && draft) {
    return <EditForm draft={draft} setDraft={setDraft} saving={saving} notice={notice} onSave={save} onCancel={() => setEditing(false)} onDelete={deleteCampus} />
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/manager/campuses" className="text-sm text-accent-700 underline underline-offset-4">
            ← All campuses
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-medium">{campus.name}</h1>
          <p className="mt-1 text-sm text-neutral-700">
            {[campus.city, campus.state].filter(Boolean).join(', ') || 'Location not set'}
            {campus.enrollment ? ` · ${campus.enrollment.toLocaleString()} students` : ''}
            {campus.team ? ` · ${campus.team}` : ''}
          </p>
        </div>
        <button
          onClick={startEdit}
          className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100"
        >
          Edit details
        </button>
      </div>
      {notice && <p className="-mt-4 text-sm text-accent-800">{notice}</p>}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Followers" value={campus.followers_count.toLocaleString()} />
        <Stat label="Following" value={campus.following_count.toLocaleString()} />
        <Stat label="Surveys sent" value={campus.surveys_sent.toLocaleString()} />
        <Stat label="Conversations" value={campus.conversations_count.toLocaleString()} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Left column: Instagram, links, details */}
        <div className="flex flex-col gap-6">
          <Card title="Instagram account">
            {handle ? (
              <div className="flex flex-col gap-3">
                <a
                  href={instagramUrl(handle)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 self-start rounded-md bg-accent px-4 py-2 font-ui text-sm font-semibold text-white hover:bg-accent-600"
                >
                  Open @{handle} ↗
                </a>
                <div className="text-sm">
                  <div className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">Password</div>
                  {password ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <code className="rounded bg-neutral-100 px-2 py-1 font-mono text-sm">
                        {showPassword ? password : '••••••••••'}
                      </code>
                      <button onClick={() => setShowPassword((v) => !v)} className="text-xs text-accent-700 underline underline-offset-4">
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={copyPassword} className="text-xs text-accent-700 underline underline-offset-4">
                        Copy
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-neutral-600">No password saved.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-600">No Instagram handle yet — add one with Edit details.</p>
            )}
          </Card>

          <Card title="Contact & links">
            <dl className="grid gap-2 text-sm">
              <Row label="Campus email">
                {campus.contact_email ? (
                  <a href={`mailto:${campus.contact_email}`} className="text-accent-700 underline underline-offset-4">
                    {campus.contact_email}
                  </a>
                ) : '—'}
              </Row>
              <Row label="Survey">
                {campus.survey_link ? (
                  <a href={withScheme(campus.survey_link)} target="_blank" rel="noreferrer" className="text-accent-700 underline underline-offset-4">
                    {campus.survey_link} ↗
                  </a>
                ) : '—'}
              </Row>
              <Row label="Ministries (sheet)">{campus.ministry || '—'}</Row>
              {campus.note && <Row label="Note">{campus.note}</Row>}
            </dl>
          </Card>

          <Card
            title="Research"
            action={
              <Link href={`/manager/research?campus=${campus.id}`} className="text-xs text-accent-700 underline underline-offset-4">
                {research ? 'Full report' : 'Research this campus'}
              </Link>
            }
          >
            {research?.kind === 'report' ? (
              <div className="flex flex-col gap-2 text-sm text-neutral-800">
                <div className="flex flex-wrap gap-2">
                  <Pill>{affiliationShort(research.report)}</Pill>
                  <Pill>{research.report.ministries.length} ministries</Pill>
                  <Pill>Researched {formatDate(research.researchedAt)}</Pill>
                </div>
                <p className="leading-relaxed">{research.report.summary}</p>
              </div>
            ) : research?.kind === 'legacy' ? (
              <p className="text-sm text-neutral-700">Saved in an older format — open the Research tab and run it again for the full report.</p>
            ) : (
              <p className="text-sm text-neutral-600">Not researched yet.</p>
            )}
          </Card>

          {campus.goals_notes && (
            <Card title="Goals">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{campus.goals_notes}</p>
            </Card>
          )}
        </div>

        {/* Right column: intern work */}
        <div className="flex flex-col gap-6">
          <Card title="Intern work so far">
            <div className="flex flex-col gap-4">
              <div className="text-sm">
                <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">Assigned</span>
                <p className="mt-1 text-neutral-800">
                  {assignedIds.length ? assignedIds.map(nameOf).join(', ') : 'No intern assigned yet — assign one from the Interns page.'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Accounts reviewed" value={String(reviews.length)} />
                <Stat label="Added" value={String(added)} />
                <Stat label="Students found" value={String(prospects.length)} />
              </div>
              <p className="text-xs text-neutral-600">
                {lastActivity ? `Last activity ${formatDate(lastActivity)}.` : 'No activity recorded yet.'}
              </p>
            </div>
          </Card>

          <Card title={`Instagram accounts reviewed (${reviews.length})`}>
            {reviews.length === 0 ? (
              <p className="text-sm text-neutral-600">No accounts reviewed yet. Interns review accounts with the Instagram tool in their campus workspace.</p>
            ) : (
              <>
                <ul className="flex flex-col divide-y divide-divider text-sm">
                  {(showAllReviews ? reviews : reviews.slice(0, 10)).map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <a href={instagramUrl(r.handle)} target="_blank" rel="noreferrer" className="font-medium text-ink underline-offset-4 hover:underline">
                        @{r.handle}
                      </a>
                      <span className="flex items-center gap-3 text-xs text-neutral-600">
                        <span className={`rounded-full px-2 py-0.5 ${r.decision === 'added' ? 'bg-accent-100 text-accent-800' : 'bg-neutral-100 text-neutral-700'}`}>
                          {r.decision === 'added' ? 'Added' : 'Skipped'}
                        </span>
                        {nameOf(r.intern_id)} · {formatDate(r.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
                {reviews.length > 10 && (
                  <button onClick={() => setShowAllReviews((v) => !v)} className="mt-2 text-xs text-accent-700 underline underline-offset-4">
                    {showAllReviews ? 'Show fewer' : `Show all ${reviews.length}`}
                  </button>
                )}
              </>
            )}
          </Card>

          <Card title={`Students found (${prospects.length})`}>
            {prospects.length === 0 ? (
              <p className="text-sm text-neutral-600">No students added yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-divider text-sm">
                {prospects.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium text-ink">{p.full_name}</span>
                      {p.instagram_handle && (
                        <a href={instagramUrl(p.instagram_handle)} target="_blank" rel="noreferrer" className="ml-2 text-xs text-accent-700 underline underline-offset-4">
                          @{p.instagram_handle.replace(/^@/, '')}
                        </a>
                      )}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">{stageOf(p)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Tasks (${openTasks.length} open of ${tasks.length})`}>
            {tasks.length === 0 ? (
              <p className="text-sm text-neutral-600">No tasks yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-divider text-sm">
                {tasks.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className={t.status === 'done' ? 'text-neutral-500 line-through' : 'text-ink'}>{t.title}</span>
                    <span className="text-xs text-neutral-600">
                      {t.intern_id ? `${nameOf(t.intern_id)} · ` : ''}
                      {t.due_date ? `due ${t.due_date}` : 'no due date'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-divider p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="break-words text-neutral-800">{children}</dd>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">{children}</span>
}

function EditForm({
  draft, setDraft, saving, notice, onSave, onCancel, onDelete,
}: {
  draft: Campus
  setDraft: (c: Campus) => void
  saving: boolean
  notice: string
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  const input = 'rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none'
  const label = 'font-heading text-[11px] uppercase tracking-widest text-neutral-700'
  const text = (key: 'name' | 'city' | 'state' | 'ministry' | 'instagram_handle' | 'survey_link' | 'team' | 'contact_email', title: string) => (
    <label className="grid gap-1.5">
      <span className={label}>{title}</span>
      <input value={draft[key] || ''} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className={input} />
    </label>
  )
  const num = (key: 'followers_count' | 'following_count' | 'surveys_sent' | 'conversations_count', title: string) => (
    <label className="grid gap-1.5">
      <span className={label}>{title}</span>
      <input type="number" min={0} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })} className={input} />
    </label>
  )

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <button onClick={onCancel} className="text-sm text-accent-700 underline underline-offset-4">
          ← Back to campus
        </button>
        <h1 className="mt-2 font-heading text-2xl font-medium">Edit {draft.name}</h1>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {text('name', 'Campus name')}
        {text('city', 'City')}
        {text('state', 'State')}
        {text('ministry', 'Existing ministries')}
        {text('team', 'Team / region')}
        <label className="grid gap-1.5">
          <span className={label}>Enrollment</span>
          <input
            type="number"
            min={0}
            value={draft.enrollment ?? ''}
            onChange={(e) => setDraft({ ...draft, enrollment: e.target.value === '' ? null : Number(e.target.value) })}
            className={input}
          />
        </label>
        {text('instagram_handle', 'Instagram handle')}
        {text('survey_link', 'Survey link')}
        {text('contact_email', 'Contact email')}
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {num('followers_count', 'Followers')}
        {num('following_count', 'Following')}
        {num('surveys_sent', 'Surveys sent')}
        {num('conversations_count', 'Conversations')}
      </section>

      <label className="grid gap-1.5">
        <span className={label}>Note</span>
        <textarea value={draft.note || ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} rows={3} className={input} />
      </label>

      <label className="grid gap-1.5">
        <span className={label}>Goals</span>
        <textarea value={draft.goals_notes || ''} onChange={(e) => setDraft({ ...draft, goals_notes: e.target.value })} rows={5} className={input} />
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-md border border-accent px-5 py-2.5 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={onCancel} className="text-sm text-neutral-700 underline underline-offset-4">
          Cancel
        </button>
        {notice && <span className="text-sm text-accent-800">{notice}</span>}
        <button onClick={onDelete} className="ml-auto text-sm text-neutral-600 underline underline-offset-4 hover:text-accent-800">
          Delete campus
        </button>
      </div>
    </div>
  )
}
