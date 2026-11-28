import Anthropic from '@anthropic-ai/sdk'
import type { ResearchReport } from '@/lib/research-format'

export type { ResearchReport }

// AI campus research: Claude searches the web and returns a structured report
// on what matters when planning a Cru launch at a campus.
// Server-side only (uses ANTHROPIC_API_KEY) — import it from API routes, never
// from client components.


const SAVE_TOOL = {
  name: 'save_research',
  description: 'Submit the finished campus research report. Call this exactly once, after researching.',
  strict: true,
  input_schema: {
    type: 'object' as const,
    additionalProperties: false,
    required: [
      'campus_name', 'summary', 'affiliation', 'ministries', 'club_policy',
      'enrollment', 'other_notes', 'sources', 'confidence',
    ],
    properties: {
      campus_name: { type: 'string', description: 'Official name of the institution (and campus/branch if relevant).' },
      summary: { type: 'string', description: '2-4 sentences a ministry manager can read at a glance.' },
      affiliation: {
        type: 'object',
        additionalProperties: false,
        required: ['category', 'denomination', 'details'],
        properties: {
          category: { type: 'string', enum: ['public', 'private_secular', 'religious'] },
          denomination: { type: ['string', 'null'], description: 'e.g. "Catholic (Franciscan)", "Southern Baptist"; null if not religiously affiliated.' },
          details: { type: 'string', description: 'What the affiliation means in practice for an outside Christian student group (chaplaincy, campus ministry office, restrictions, openness).' },
        },
      },
      ministries: {
        type: 'array',
        description: 'Religious / Christian student organizations and ministries active on campus (including Cru if present). Empty if none found.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'kind', 'notes', 'url'],
          properties: {
            name: { type: 'string' },
            kind: { type: 'string', description: 'e.g. "Christian - InterVarsity", "Catholic campus ministry", "Baptist Collegiate Ministries", "FCA", "non-Christian faith group".' },
            notes: { type: 'string', description: 'Activity level, size or recency of evidence, if known.' },
            url: { type: ['string', 'null'] },
          },
        },
      },
      club_policy: {
        type: 'object',
        additionalProperties: false,
        required: ['summary', 'requirements', 'religious_groups', 'how_to_start_url'],
        properties: {
          summary: { type: 'string', description: 'How a new student organization gets recognized at this school.' },
          requirements: { type: 'array', items: { type: 'string' }, description: 'Concrete requirements: minimum members, faculty/staff advisor, constitution, officer rules, approval body, timing.' },
          religious_groups: { type: ['string', 'null'], description: 'Any rules specific to religious organizations (e.g. leadership/membership policies, must be sponsored by campus ministry office). Null if nothing specific found.' },
          how_to_start_url: { type: ['string', 'null'], description: 'Link to the official page or handbook on starting a club.' },
        },
      },
      enrollment: { type: ['string', 'null'], description: 'Approximate student enrollment with year, if found.' },
      other_notes: { type: 'array', items: { type: 'string' }, description: 'Anything else useful for planning a launch (commuter vs residential, nearby churches partnering with students, recent news).' },
      sources: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'url'],
          properties: { title: { type: 'string' }, url: { type: 'string' } },
        },
      },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: 'How well-supported the findings are by official or recent sources.' },
    },
  },
}

const SYSTEM = `You research US college campuses for Cru (a Christian campus ministry) staff who are deciding whether and how to start a ministry there.

Use web search (and fetch official pages when useful) to find, preferring the school's own website and recent sources:
1. Religious affiliation: public, private secular, or religious - and if religious, the denomination and what that means for an outside Christian group.
2. Existing Christian ministries and faith-based student organizations on campus (InterVarsity, Chi Alpha, BCM, FCA, Navigators, Catholic campus ministry, Cru, etc.). Count only ones with evidence of activity; say when evidence is old.
3. The school's policy for starting a new student organization: member minimums, advisor rules, constitution, approval process, and anything specific to religious groups.

Be factual. If you can't find something, say so rather than guessing. When you're done, call save_research once with the full report, listing the pages you relied on as sources.`

export class ResearchError extends Error {}

export async function researchCampus(campus: { name: string; city?: string | null; state?: string | null }): Promise<ResearchReport> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ResearchError('AI research isn’t set up yet: the ANTHROPIC_API_KEY setting is missing.')
  }
  const client = new Anthropic()
  const where = [campus.city, campus.state].filter(Boolean).join(', ')
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: 'user',
      content: `Research this campus: ${campus.name}${where ? ` (${where})` : ''}.`,
    },
  ]

  // Web search runs on Anthropic's servers inside each response. The loop only
  // continues paused turns, and stops when Claude submits the report.
  for (let turn = 0; turn < 6; turn++) {
    const response = await client.beta.messages
      .stream({
        model: 'claude-opus-5-5',
        max_tokens: 32000,
        output_config: { effort: 'medium' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM,
        tools: [
          { type: 'web_search_20260209', name: 'web_search', max_uses: 8 },
          { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 4 },
          SAVE_TOOL,
        ],
        messages,
      })
      .finalMessage()

    const submitted = response.content.find(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use' && b.name === 'save_research',
    )
    if (submitted) return submitted.input as ResearchReport

    if (response.stop_reason === 'refusal') {
      throw new ResearchError('The research request was declined. Try rephrasing the campus name.')
    }
    if (response.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content })
      continue
    }
    if (response.stop_reason === 'max_tokens') {
      throw new ResearchError('The research ran too long before finishing. Try again.')
    }
    // Finished without submitting: ask once more for the report.
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: 'Please submit your findings now with save_research.' })
  }
  throw new ResearchError('The research didn’t finish. Try again in a moment.')
}
