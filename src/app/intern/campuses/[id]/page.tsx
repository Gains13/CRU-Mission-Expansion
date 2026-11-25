import { redirect } from 'next/navigation'

export default async function InternCampusIndex({ params }: PageProps<'/intern/campuses/[id]'>) {
  const { id } = await params
  redirect(`/intern/campuses/${id}/tasks`)
}
