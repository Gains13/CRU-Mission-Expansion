'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { pingExtension, openViaExtension } from '@/lib/cru-extension'

type Decision = 'added' | 'skipped'

type LogEntry = {
  id: string
  handle: string
  decision: Decision
  created_at: string
}

const DECISIONS: [Decision, string][] = [
  ['added', 'Yes — add to follow list'],
  ['skipped', "No — doesn't meet criteria"],
]

// Named window target: reopening/navigating with the same name reuses one
// tab instead of piling up new ones, so the intern stays on this page.
const REVIEW_WINDOW = 'cru_ig_review'

function parseHandles(raw: string): string[] {
  const seen = new Set<string>()
  const handles: string[] = []
  raw
    .split(/[\s,]+/)
    .map((h) => h.trim().replace(/^@/, ''))
    .filter(Boolean)
    .forEach((h) => {
      if (!seen.has(h)) {
        seen.add(h)
        handles.push(h)
      }
    })
  return handles
}

export default function InstagramReviewTool({ campusId }: { campusId: string }) {
  const supabase = createClient()

  const [raw, setRaw] = useState('')
  const [current, setCurrent] = useState<string | null>(null)
  const [queue, setQueue] = useState<string[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [helper, setHelper] = useState(false)

  useEffect(() => {
    loadLog()
  }, [campusId])

  useEffect(() => {
    pingExtension().then(setHelper)
  }, [])

  async function loadLog() {
    const { data } = await supabase
      .from('instagram_review_log')
      .select('id, handle, decision, created_at')
      .eq('campus_id', campusId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setLog(data)
  }

  function openHandle(handle: string) {
    const url = `https://www.instagram.com/${handle}/`
    const width = Math.floor(window.screen.availWidth / 2)
    const height = window.screen.availHeight

    if (helper) {
      openViaExtension(url, { left: width, top: 0, width, height })
      return
    }

    // Fallback without the helper: Instagram blocks window reuse, so this
    // opens a new popup each time.
    window.open(url, REVIEW_WINDOW, `popup=yes,width=${width},height=${height},left=${width},top=0`)
    // Opening/navigating the other window pulls OS focus to it — pull focus
    // straight back so the decision buttons are clickable without an extra
    // click on this window first.
    window.focus()
  }

  function stageHandles() {
    const handles = parseHandles(raw)
    if (handles.length === 0) return
    setRaw('')

    if (!current) {
      const [next, ...rest] = handles
      setCurrent(next)
      setQueue((prev) => [...prev, ...rest])
      openHandle(next)
    } else {
      setQueue((prev) => [...prev, ...handles])
    }
  }

  async function decide(decision: Decision) {
    if (!current) return
    const handle = current
    const remaining = queue

    if (remaining.length > 0) {
      const [next, ...rest] = remaining
      setCurrent(next)
      setQueue(rest)
      openHandle(next)
    } else {
      setCurrent(null)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: entry } = await supabase
      .from('instagram_review_log')
      .insert({ campus_id: campusId, intern_id: user.id, handle, decision })
      .select('id, handle, decision, created_at')
      .single()

    if (entry) setLog((prev) => [entry, ...prev])

    if (decision === 'added') {
      await supabase.from('prospects').insert({
        campus_id: campusId,
        full_name: `@${handle}`,
        instagram_handle: handle,
        followed: false,
        found_by: user.id,
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-neutral-700">
        Open the school&apos;s Instagram followers list yourself, highlight a batch of usernames, and
        copy them (Ctrl/Cmd+C) — then paste the whole block below in one go. The tool opens one
        account at a time in a single Instagram window; after you decide, it moves that same tab on
        to the next one. This never automates or scrapes Instagram — it just opens a page and
        records what you decide.
      </p>
      <p className={`text-xs ${helper ? 'text-accent-800' : 'text-neutral-600'}`}>
        {helper
          ? 'Helper extension connected — accounts open in one reused window.'
          : 'Helper extension not detected — each account will open in a new window. Install the helper (see extension/README.md) and refresh.'}
      </p>

      <div className="grid gap-1.5">
        <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
          Handles (paste a copied block, one per line, or comma-separated)
        </span>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={4}
          placeholder="@student_one, @student_two"
          className="rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <button
          onClick={stageHandles}
          className="w-fit rounded-md border border-divider px-4 py-1.5 font-heading text-xs font-semibold text-neutral-800 hover:bg-neutral-200"
        >
          {current ? 'Add to queue' : 'Start reviewing'}
        </button>
      </div>

      {current && (
        <div className="flex items-center justify-between rounded-md border border-accent bg-accent-100 p-4">
          <div>
            <div className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
              Now reviewing
            </div>
            <a
              href={`https://www.instagram.com/${current}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading text-lg font-semibold text-accent-800 underline underline-offset-4"
            >
              @{current}
            </a>
            {queue.length > 0 && (
              <div className="mt-1 text-xs text-neutral-600">{queue.length} more queued</div>
            )}
          </div>
          <div className="flex gap-2">
            {DECISIONS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => decide(value)}
                className="rounded-md border border-accent px-3 py-1.5 text-xs font-semibold text-accent-800 hover:bg-accent-200"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!current && (
        <p className="text-sm text-neutral-600">Paste handles above to start reviewing.</p>
      )}

      {log.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
            Recent decisions
          </span>
          <div className="flex flex-col gap-1">
            {log.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm text-neutral-700">
                <span>@{entry.handle}</span>
                <span className="text-xs text-neutral-600">
                  {DECISIONS.find(([v]) => v === entry.decision)?.[1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
