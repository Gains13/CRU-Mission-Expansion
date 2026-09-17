'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Scope = 'off' | 'staff' | 'everyone'
type Flag = {
  id: string
  name: string
  description: string | null
  scope: Scope
}

const SCOPE_CYCLE: Scope[] = ['off', 'staff', 'everyone']
const SCOPE_LABEL: Record<Scope, string> = {
  off: 'Off',
  staff: 'Staff only',
  everyone: 'Everyone',
}

export default function FlagsPage() {
  const supabase = createClient()
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('feature_flags')
      .select('id, name, description, scope')
      .order('created_at', { ascending: true })
    if (data) setFlags(data)
    setLoading(false)
  }

  async function cycleScope(flag: Flag) {
    const next = SCOPE_CYCLE[(SCOPE_CYCLE.indexOf(flag.scope) + 1) % SCOPE_CYCLE.length]
    setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, scope: next } : f)))
    await supabase.from('feature_flags').update({ scope: next }).eq('id', flag.id)
  }

  async function toggle(flag: Flag) {
    const next: Scope = flag.scope === 'off' ? 'staff' : 'off'
    setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, scope: next } : f)))
    await supabase.from('feature_flags').update({ scope: next }).eq('id', flag.id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Feature flags</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-800">
          Flags gate unfinished work. Turn one on for staff only while you test in
          preview, then promote it to everyone once the manager has reviewed it.
          Nothing here needs a redeploy.
        </p>
      </div>

      {loading && <p className="text-sm text-neutral-600">Loading…</p>}

      <div className="flex flex-col">
        {flags.map((flag) => {
          const on = flag.scope !== 'off'
          return (
            <div
              key={flag.id}
              className="grid grid-cols-[1fr_110px_56px] items-center gap-4 border-b border-divider py-3.5"
            >
              <div>
                <div className="font-heading text-sm font-semibold">{flag.name}</div>
                <div className="text-sm text-neutral-700">{flag.description}</div>
              </div>
              <button
                onClick={() => cycleScope(flag)}
                className="rounded-md border border-divider px-2.5 py-1 font-heading text-xs font-semibold text-neutral-800 hover:bg-neutral-200"
              >
                {SCOPE_LABEL[flag.scope]}
              </button>
              <button
                onClick={() => toggle(flag)}
                className={`justify-self-end flex h-5.5 w-11 items-center rounded-full border p-0.5 ${
                  on
                    ? 'justify-end border-accent bg-accent-200'
                    : 'justify-start border-divider bg-transparent'
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full ${
                    on ? 'bg-accent-700' : 'bg-neutral-500'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}