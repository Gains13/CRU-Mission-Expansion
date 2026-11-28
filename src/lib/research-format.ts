// Shape and storage format of an AI campus research report. Safe to import
// from client components (no API keys or SDK here).

export type ResearchReport = {
  campus_name: string
  summary: string
  affiliation: {
    category: 'public' | 'private_secular' | 'religious'
    denomination: string | null
    details: string
  }
  ministries: { name: string; kind: string; notes: string; url: string | null }[]
  club_policy: {
    summary: string
    requirements: string[]
    religious_groups: string | null
    how_to_start_url: string | null
  }
  enrollment: string | null
  other_notes: string[]
  sources: { title: string; url: string }[]
  confidence: 'high' | 'medium' | 'low'
}

// The latest report is stored as JSON in campuses.research_notes.
type Stored = { type: 'ai-research'; version: 1; researched_at: string; report: ResearchReport }

export type SavedResearch =
  | { kind: 'report'; report: ResearchReport; researchedAt: string }
  | { kind: 'legacy'; text: string }

export function serializeResearch(report: ResearchReport, date = new Date()) {
  const stored: Stored = { type: 'ai-research', version: 1, researched_at: date.toISOString(), report }
  return JSON.stringify(stored)
}

export function parseResearch(value: string | null | undefined): SavedResearch | null {
  if (!value?.trim()) return null
  if (value.trimStart().startsWith('{')) {
    try {
      const stored = JSON.parse(value) as Stored
      if (stored?.type === 'ai-research' && stored.report) {
        return { kind: 'report', report: stored.report, researchedAt: stored.researched_at }
      }
    } catch {
      // fall through to legacy text
    }
  }
  // Older plain-text research saved before reports were stored in full.
  return { kind: 'legacy', text: value }
}

export const AFFILIATION_LABEL: Record<ResearchReport['affiliation']['category'], string> = {
  public: 'Public',
  private_secular: 'Private, not religious',
  religious: 'Religiously affiliated',
}

export function affiliationShort(r: ResearchReport) {
  return r.affiliation.category === 'religious' && r.affiliation.denomination
    ? r.affiliation.denomination
    : AFFILIATION_LABEL[r.affiliation.category]
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
