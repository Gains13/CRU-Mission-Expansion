import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { email, role } = await request.json()

  if (!email || !role || !['intern', 'manager', 'developer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid email or role' }, { status: 400 })
  }

  // 1. Verify the CALLER is actually signed in and is a developer.
  //    This uses the normal server client, which respects RLS/auth cookies —
  //    it cannot be spoofed by editing client-side JavaScript.
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

  if (profile?.role !== 'developer') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // 2. Caller is confirmed a real developer — now use the admin client
  //    (service role) to actually send the invite email via Supabase.
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: '', pending_role: role },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // 3. Pre-set their role so the moment they accept the email and set a
  //    password, they land in the right portal immediately.
  if (data.user) {
    await admin.from('profiles').update({ role }).eq('id', data.user.id)
  }

  return NextResponse.json({ success: true })
}