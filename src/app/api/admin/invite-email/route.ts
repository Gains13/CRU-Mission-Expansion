import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { explainEmailError } from '@/lib/auth-errors'

export async function POST(request: NextRequest) {
  const { email, role, fullName: rawName } = await request.json()
  const fullName = typeof rawName === 'string' ? rawName.trim().slice(0, 100) : ''

  if (!email || !role || !['intern', 'manager', 'developer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid email or role' }, { status: 400 })
  }
  if (!fullName) {
    return NextResponse.json({ error: 'Enter their full name' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const callerRole = profile?.role

  if (callerRole !== 'developer' && callerRole !== 'manager') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Managers can only bring on interns — same rule the database enforces
  if (callerRole === 'manager' && role !== 'intern') {
    return NextResponse.json({ error: 'Managers can only invite interns' }, { status: 403 })
  }

  const admin = createAdminClient()

  // The invite link signs them in and lands on the page where they set
  // their first password (session arrives in the link's #fragment).
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, pending_role: role },
    redirectTo: `${request.nextUrl.origin}/reset-password?welcome=1`,
  })

  if (error) {
    console.error('[invite-email] Supabase rejected the invite:', error.code, error.message)
    return NextResponse.json({ error: explainEmailError(error) }, { status: 400 })
  }

  if (data.user) {
    await admin.from('profiles').update({ role, full_name: fullName }).eq('id', data.user.id)
  }

  return NextResponse.json({ success: true })
}