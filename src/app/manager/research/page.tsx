import ResearchClient from './client'

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ campus?: string }>
}) {
  const { campus } = await searchParams
  return <ResearchClient initialCampusId={campus ?? ''} />
}
