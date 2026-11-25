'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CampusTasksPanel from '@/components/intern/campus-tasks-panel'

export default function InternCampusTasksPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [goalsNotes, setGoalsNotes] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('campuses').select('goals_notes').eq('id', id).single()
      setGoalsNotes(data?.goals_notes ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>

  return <CampusTasksPanel campusId={id} goalsNotes={goalsNotes} />
}
