'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { affiliationShort, formatDate, parseResearch, type ResearchReport } from '@/lib/research-format'
import ReportView from '@/components/research/ReportView'

type Campus = { id: string; name: string; city: string | null; state: string | null; research_notes: string | null }

const OTHER = '__other__'

export default function ResearchClient({ initialCampusId }: { initialCampusId: string }) {
  const supabase = createClient()
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [selected, setSelected] = useState(initialCampusId)
  const [other, setOther] = useState({ name: '', city: '', state: '' })
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [otherReport, setOtherReport] = useState<ResearchReport | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const timer = useRef<number | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

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
  const saved = campus ? parseResearch(campus.research_notes) : null
  const canRun = !running && (selected === OTHER ? other.name.trim().length > 1 : !!campus)

  function choose(id: string) {
    setSelected(id)
    setError('')
    setOtherReport(null)
    window.setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  async function run() {
    if (!canRun) return
    setError('')
    setOtherReport(null)
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
      } else if (selected === OTHER) {
        setOtherReport(json.report)
      } else {
        if (!json.saved) setError('The research finished but couldn’t be saved to the campus. Try again.')
        setReloadKey((k) => k + 1)
      }
    } catch {
      setError('Couldn’t reach the server. Check your internet connection and try again.')
    } finally {
      if (timer.current) window.clearInterval(timer.current)
      setRunning(false)
    }
  }

  const researchedCount = campuses.filter((c) => parseResearch(c.research_notes)?.kind === 'report').length
  const inputClass =
    'rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none'

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium">Campus research</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-700">
          AI searches the web for a campus&apos;s religious affiliation, the ministries already there,
          and the rules for starting a student club. Each campus keeps its latest full report.
        </p>
      </div>

      {/* Overview */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
            Your campuses · {researchedCount} of {campuses.length} researched
          </h2>
        </div>
        <div className="overflow-x-auto rounded-md border border-divider">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100">
                {['Campus', 'Affiliation', 'Ministries', 'Club rules', 'Researched'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-heading text-[11px] uppercase tracking-widest text-neutral-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campuses.map((c) => {
                const r = parseResearch(c.research_notes)
                const report = r?.kind === 'report' ? r.report : null
                const active = c.id === selected
                return (
                  <tr
                    key={c.id}
                    onClick={() => choose(c.id)}
                    className={`cursor-pointer border-t border-divider ${active ? 'bg-accent-100' : 'hover:bg-neutral-100'}`}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-heading font-semibold">{c.name}</span>
                      <span className="block text-xs text-neutral-600">{[c.city, c.state].filter(Boolean).join(', ')}</span>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-800">{report ? affiliationShort(report) : '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums text-neutral-800">{report ? report.ministries.length : '—'}</td>
                    <td className="px-4 py-2.5 text-neutral-800">
                      {report ? (report.club_policy.religious_groups ? 'Has religious-group rules' : 'Standard') : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-700">
                      {r?.kind === 'report' ? formatDate(r.researchedAt) : r?.kind === 'legacy' ? 'Old format' : (
                        <span className="text-neutral-500">Not yet</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => choose(OTHER)}
          className={`self-start text-sm underline underline-offset-4 ${selected === OTHER ? 'text-accent-800' : 'text-accent-700'}`}
        >
          Research a campus that isn&apos;t on your list
        </button>
      </section>

      {/* Selected campus */}
      <div ref={reportRef} className="scroll-mt-28">
        {selected && (
          <section className="flex flex-col gap-5 rounded-md border border-divider p-6">
            <div className="flex flex-wrap items-end gap-3">
              {selected === OTHER ? (
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
                    <input value={other.city} onChange={(e) => setOther((o) => ({ ...o, city: e.target.value }))} disabled={running} className={`${inputClass} w-36`} />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="font-heading text-xs uppercase tracking-widest text-neutral-700">State</span>
                    <input value={other.state} onChange={(e) => setOther((o) => ({ ...o, state: e.target.value }))} disabled={running} className={`${inputClass} w-20`} />
                  </label>
                </>
              ) : (
                campus && (
                  <div className="mr-auto">
                    <div className="font-heading text-lg font-medium">{campus.name}</div>
                    <Link href={`/manager/campuses/${campus.id}`} className="text-sm text-accent-700 underline underline-offset-4">
                      Open campus page
                    </Link>
                  </div>
                )
              )}
              <button
                onClick={run}
                disabled={!canRun}
                className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
              >
                {running ? 'Researching…' : saved ? 'Research again' : 'Research'}
              </button>
            </div>

            {running && (
              <div className="rounded-md bg-neutral-100 p-4 text-sm text-neutral-800">
                <p className="font-semibold">Searching the web… {elapsed}s</p>
                <p className="mt-1 text-neutral-600">This usually takes 1–3 minutes. Keep this page open until it finishes.</p>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-accent-800">{error}</div>
            )}

            {!running && selected === OTHER && otherReport && (
              <>
                <ReportView report={otherReport} />
                <p className="text-xs text-neutral-600">This campus isn&apos;t on your list, so this report isn&apos;t saved.</p>
              </>
            )}

            {!running && selected !== OTHER && saved?.kind === 'report' && (
              <ReportView report={saved.report} researchedAt={saved.researchedAt} />
            )}

            {!running && selected !== OTHER && saved?.kind === 'legacy' && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-neutral-700">
                  This research was saved in an older, shorter format. Click <strong>Research again</strong> for the full report.
                </p>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-4 font-sans text-sm leading-relaxed text-neutral-800">
                  {saved.text}
                </pre>
              </div>
            )}

            {!running && selected !== OTHER && campus && !saved && !error && (
              <p className="text-sm text-neutral-600">Not researched yet. Click <strong>Research</strong> to run it (1–3 minutes).</p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
