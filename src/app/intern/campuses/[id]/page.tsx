'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CampusTasksPanel from '@/components/intern/campus-tasks-panel'
import CampusPasswordPanel from '@/components/intern/campus-password-panel'
import InstagramReviewTool from '@/components/intern/instagram-review-tool'

type Campus = {
  id: string
  name: string
  city: string | null
  state: string | null
  instagram_handle: string | null
  goals_notes: string | null
  followers_count: number
  following_count: number
  surveys_sent: number
  conversations_count: number
}

export default function InternCampusDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [campus, setCampus] = useState<Campus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('campuses')
      .select(
        'id, name, city, state, instagram_handle, goals_notes, followers_count, following_count, surveys_sent, conversations_count'
      )
      .eq('id', id)
      .single()
    if (data) setCampus(data)
    setLoading(false)
  }

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>
  if (!campus) return <p className="text-sm text-neutral-600">Campus not found.</p>

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/intern/campuses" className="text-sm text-accent-700 underline underline-offset-4">
          ← Campus workspace
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-medium">{campus.name}</h1>
        <p className="mt-1 text-sm text-neutral-700">
          {[campus.city, campus.state].filter(Boolean).join(', ') || '—'}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-neutral-700">
          Goals & tasks
        </h2>
        <CampusTasksPanel campusId={campus.id} goalsNotes={campus.goals_notes} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-neutral-700">
          Account info
        </h2>
        <CampusPasswordPanel
          campusId={campus.id}
          instagramHandle={campus.instagram_handle}
          followersCount={campus.followers_count}
          followingCount={campus.following_count}
          surveysSent={campus.surveys_sent}
          conversationsCount={campus.conversations_count}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-neutral-700">
          Instagram review tool
        </h2>
        <InstagramReviewTool campusId={campus.id} />
      </section>
    </div>
  )
}
