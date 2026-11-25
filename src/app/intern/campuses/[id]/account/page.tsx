'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CampusPasswordPanel from '@/components/intern/campus-password-panel'

type Stats = {
  instagram_handle: string | null
  followers_count: number
  following_count: number
  surveys_sent: number
  conversations_count: number
}

export default function InternCampusAccountPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('campuses')
        .select('instagram_handle, followers_count, following_count, surveys_sent, conversations_count')
        .eq('id', id)
        .single()
      setStats(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <p className="text-sm text-neutral-600">Loading…</p>
  if (!stats) return <p className="text-sm text-neutral-600">Campus not found.</p>

  return (
    <CampusPasswordPanel
      campusId={id}
      instagramHandle={stats.instagram_handle}
      followersCount={stats.followers_count}
      followingCount={stats.following_count}
      surveysSent={stats.surveys_sent}
      conversationsCount={stats.conversations_count}
    />
  )
}
