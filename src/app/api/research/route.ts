import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { ResearchError, mergeIntoNotes, reportToNotes, researchCampus } from '@/lib/campus-research'

// Research with web search usually takes 1-3 minutes.
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Your session has ended. Sign in again.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager' && profile?.role !== 'developer') {
    return NextResponse.json({ error: 'Only managers can run campus research.' }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as
    | { campusId?: string; name?: string; city?: string; state?: string }
    | null

  // Either a campus from the list (results are saved to its notes) or any
  // campus typed in by name (results are shown but not saved).
  let campus: { id?: string; name: string; city: string | null; state: string | null; research_notes?: string | null }
  if (body?.campusId) {
    const { data } = await supabase
      .from('campuses')
      .select('id, name, city, state, research_notes')
      .eq('id', body.campusId)
      .single()
    if (!data) return NextResponse.json({ error: 'That campus wasn’t found.' }, { status: 404 })
    campus = data
  } else if (body?.name?.trim()) {
    campus = {
      name: body.name.trim().slice(0, 200),
      city: body.city?.trim().slice(0, 100) || null,
      state: body.state?.trim().slice(0, 50) || null,
    }
  } else {
    return NextResponse.json({ error: 'Choose a campus or type a campus name.' }, { status: 400 })
  }

  try {
    const report = await researchCampus(campus)
    let saved = false
    if (campus.id) {
      const notes = mergeIntoNotes(campus.research_notes ?? null, reportToNotes(report))
      const { error } = await supabase.from('campuses').update({ research_notes: notes }).eq('id', campus.id)
      saved = !error
      if (error) console.error('[research] could not save notes:', error.message)
    }
    return NextResponse.json({ report, saved })
  } catch (error) {
    if (error instanceof ResearchError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('[research] Anthropic key rejected')
      return NextResponse.json({ error: 'AI research isn’t set up correctly (the API key was rejected).' }, { status: 503 })
    }
    if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message)) {
      console.error('[research] Anthropic account is out of credits')
      return NextResponse.json(
        { error: 'AI research is out of credits. Add credits under Plans & Billing in the Anthropic console, then try again.' },
        { status: 503 },
      )
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Too many research requests right now. Wait a minute and try again.' }, { status: 429 })
    }
    if (error instanceof Anthropic.APIError) {
      console.error('[research] Anthropic API error', error.status, error.message)
      return NextResponse.json({ error: 'The research service had a problem. Try again in a moment.' }, { status: 502 })
    }
    console.error('[research] unexpected error', error)
    return NextResponse.json({ error: 'Something went wrong while researching. Try again.' }, { status: 500 })
  }
}
