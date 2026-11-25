'use client'

import { useParams } from 'next/navigation'
import InstagramReviewTool from '@/components/intern/instagram-review-tool'

export default function InternCampusInstagramPage() {
  const { id } = useParams<{ id: string }>()
  return <InstagramReviewTool campusId={id} />
}
