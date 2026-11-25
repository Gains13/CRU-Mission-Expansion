'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SubNav from '@/components/SubNav'

type Campus = { id: string; name: string; city: string | null; state: string | null }

export default function InternCampusLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [campus, setCampus] = useState<Campus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('campuses').select('id, name, city, state').eq('id', id).single()
      setCampus(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>
  if (!campus) return <p className="text-sm text-neutral-600">Campus not found.</p>

  const base = `/intern/campuses/${campus.id}`

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div>
          <Link href="/intern/campuses" className="text-sm text-accent-700 underline underline-offset-4">
            ← Campus workspace
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-medium">{campus.name}</h1>
          <p className="mt-1 text-sm text-neutral-700">
            {[campus.city, campus.state].filter(Boolean).join(', ') || '—'}
          </p>
        </div>
        <SubNav
          items={[
            { href: `${base}/tasks`, label: 'Goals & tasks' },
            { href: `${base}/account`, label: 'Account info' },
            { href: `${base}/instagram`, label: 'Instagram review' },
          ]}
        />
      </div>
      {children}
    </div>
  )
}
