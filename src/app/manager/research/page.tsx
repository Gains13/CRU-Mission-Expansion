'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ResearchReport } from '@/lib/campus-research'

type Campus = { id: string; name: string; city: string | null; state: string | null; research_notes: string | null }

const OTHER = '__other__'
const AI_BLOCK_START = '=== AI research'
const AI_BLOCK_END = '=== end AI research ==='

function savedResearch(notes: string | null) {
  if (!notes) return null
  const start = notes.indexOf(AI_BLOCK_START)
  const end = notes.indexOf(AI_BLOCK_END)
  return start >= 0 && end > start ? notes.slice(start, end).trim() : null
}

const AFFILIATION_LABEL: Record<ResearchReport['affiliation']['category'], string> = {
  public: 'Public',
  private_secular: 'Private, not religious',
  religious: 'Religiously affiliated',
}

export default function ResearchPage() {
  const supabase = createClient()
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [selected, setSelected] = useState('')
  const [other, setOther] = useState({ name: '', city: '', state: '' })
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ report: ResearchReport; saved: boolean; campusId: string | null } | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('campuses').select('id, name, city, state, research_notes').order('name')
      if (data) setCampuses(data)
    }
    load()
  }, [reloadKey, supabase])

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current)
  }, [])

  const campus = campuses.find((c) => c.id === selected) ?? null
  const previous = campus ? savedResearch(campus.research_notes) : null
  const canRun = !running && (selected === OTHER ? other.name.trim().length > 1 : !!campus)

  async function run() {
    if (!canRun) return
    setError('')
    setResult(null)
    setRunning(true)
    setElapsed(0)
    const started = Date.now()
    timer.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)

    const body = selected === OTHER ? other : { campusId: selected }
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.report) {
        setError(json?.error ?? `The research didn’t finish (error ${res.status}). Try again.`)
      } else {
        setResult({ report: json.report, saved: !!json.saved, campusId: selected === OTHER ? null : selected })
        if (json.saved) setReloadKey((k) => k + 1)
      }
    } catch {
      setError('Couldn’t reach the server. Check your internet connection and try again.')
    } finally {
      if (timer.current) window.clearInterval(timer.current)
      setRunning(false)
    }
  }

  const inputClass =
    'rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none'

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium">Campus research</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-700">
          AI searches the web for a campus&apos;s religious affiliation, the ministries already there,
          and the rules for starting a student club. Results for campuses on your list are saved to
          that campus&apos;s research notes.
        </p>
      </div>

      <section className="flex flex-wrap items-end gap-3 rounded-md border border-divider p-5">
        <label className="grid gap-1.5">
          <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">Campus</span>
          <select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value)
              setResult(null)
              setError('')
            }}
            disabled={running}
            className={`${inputClass} w-80 max-w-full`}
          >
            <option value="">Choose a campus…</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.state ? ` (${c.state})` : ''}
              </option>
            ))}
            <option value={OTHER}>Another campus (not on the list)…</option>
          </select>
        </label>

        {selected === OTHER && (
          <>
            <label className="grid gap-1.5">
              <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">Campus name</span>
              <input
                value={other.name}
                onChange={(e) => setOther((o) => ({ ...o, name: e.target.value }))}
                placeholder="e.g. Grinnell College"
                disabled={running}
                className={`${inputClass} w-64`}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">City</span>
              <input
                value={other.city}
                onChange={(e) => setOther((o) => ({ ...o, city: e.target.value }))}
                disabled={running}
                className={`${inputClass} w-36`}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">State</span>
              <input
                value={other.state}
                onChange={(e) => setOther((o) => ({ ...o, state: e.target.value }))}
                disabled={running}
                className={`${inputClass} w-20`}
              />
            </label>
          </>
        )}

        <button
          onClick={run}
          disabled={!canRun}
          className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
        >
          {running ? 'Researching…' : previous ? 'Research again' : 'Research'}
        </button>
      </section>

      {running && (
        <div className="rounded-md border border-divider p-5 text-sm text-neutral-800">
          <p className="font-semibold">Searching the web… {elapsed}s</p>
          <p className="mt-1 text-neutral-600">
            This usually takes 1–3 minutes. Keep this page open until it finishes.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-accent-800">{error}</div>
      )}

      {result && <ReportView report={result.report} saved={result.saved} campusId={result.campusId} />}

      {!result && !running && previous && campus && (
        <section className="flex flex-col gap-2 rounded-md border border-divider p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-lg font-medium">Saved research</h2>
            <Link href={`/manager/campuses/${campus.id}`} className="text-sm text-accent-700 underline underline-offset-4">
              Open campus
            </Link>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-800">{previous.replace(/^=== /, '').replace(/ ===\n/, '\n')}</pre>
        </section>
      )}
    </div>
  )
}

function ReportView({ report, saved, campusId }: { report: ResearchReport; saved: boolean; campusId: string | null }) {
  const a = report.affiliation
  return (
    <article className="flex flex-col gap-6 rounded-md border border-divider p-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-xl font-medium">{report.campus_name}</h2>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-700">
            Confidence: {report.confidence}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-neutral-800">{report.summary}</p>
        {campusId && (
          <p className="text-xs text-neutral-600">
            {saved ? 'Saved to this campus’s research notes. ' : 'Couldn’t save to the campus notes. '}
            <Link href={`/manager/campuses/${campusId}`} className="text-accent-700 underline underline-offset-4">
              Open campus
            </Link>
          </p>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Affiliation" value={a.category === 'religious' && a.denomination ? a.denomination : AFFILIATION_LABEL[a.category]} />
        <Stat label="Ministries found" value={String(report.ministries.length)} />
        <Stat label="Enrollment" value={report.enrollment ?? 'Not found'} />
      </div>

      <Section title="Religious affiliation">
        <p>
          <strong>{AFFILIATION_LABEL[a.category]}</strong>
          {a.denomination ? ` — ${a.denomination}` : ''}. {a.details}
        </p>
      </Section>

      <Section title={`Ministries on campus (${report.ministries.length})`}>
        {report.ministries.length === 0 ? (
          <p>No active ministries were found.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {report.ministries.map((m) => (
              <li key={m.name}>
                <span className="font-semibold">
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                      {m.name}
                    </a>
                  ) : (
                    m.name
                  )}
                </span>{' '}
                <span className="text-neutral-600">· {m.kind}</span>
                {m.notes && <span className="block text-neutral-700">{m.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Starting a student club">
        <p>{report.club_policy.summary}</p>
        {report.club_policy.requirements.length > 0 && (
          <ul className="mt-2 list-disc pl-5">
            {report.club_policy.requirements.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        )}
        {report.club_policy.religious_groups && (
          <p className="mt-2">
            <strong>Religious groups:</strong> {report.club_policy.religious_groups}
          </p>
        )}
        {report.club_policy.how_to_start_url && (
          <a href={report.club_policy.how_to_start_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-accent-700 underline underline-offset-4">
            Official guide to starting a club
          </a>
        )}
      </Section>

      {report.other_notes.length > 0 && (
        <Section title="Other notes">
          <ul className="list-disc pl-5">
            {report.other_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Sources">
        <ul className="flex flex-col gap-1">
          {report.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-accent-700 underline underline-offset-4">
                {s.title || s.url}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-neutral-600">
          AI-generated from web sources — confirm important details (especially club rules) with the school.
        </p>
      </Section>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-neutral-100 px-4 py-3">
      <div className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-neutral-800">
      <h3 className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">{title}</h3>
      {children}
    </section>
  )
}
