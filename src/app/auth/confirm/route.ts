import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Landing point for links in Supabase auth emails (password reset).
//
// Handles both link styles Supabase can send:
//  - token_hash + type: works in any browser. Requires the email template to
//    link here directly (see the Reset Password template in the Supabase
//    dashboard).
//  - code: the default PKCE link. Only works in the same browser that asked
//    for the reset, because the matching verifier lives in that browser.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  const supabase = await createClient()

  let ok = false
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    ok = !error
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
  }

  if (!ok) {
    return NextResponse.redirect(new URL('/forgot-password?expired=1', origin))
  }
  return NextResponse.redirect(new URL(next, origin))
}

// Only allow same-site paths so the link can't bounce users to another site.
function safeNext(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/reset-password'
  }
  return next
}
