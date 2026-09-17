import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { email, role } = await request.json()

  if (!email || !role || !['intern', 'manager', 'developer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid email or role' }, { status: 400 })
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

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: '', pending_role: role },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.user) {
    await admin.from('profiles').update({ role }).eq('id', data.user.id)
  }

  return NextResponse.json({ success: true })
}