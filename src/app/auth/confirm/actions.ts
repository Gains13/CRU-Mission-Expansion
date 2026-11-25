'use server'

import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Runs only when the person clicks "Continue", never on a plain page load,
// so email link scanners that open links can't use up the one-time token.
export async function confirmEmailLink(formData: FormData) {
  const tokenHash = String(formData.get('token_hash') ?? '')
  const type = String(formData.get('type') ?? '') as EmailOtpType
  const code = String(formData.get('code') ?? '')
  const next = safeNext(String(formData.get('next') ?? ''))

  const supabase = await createClient()

  let failure: string | null = 'missing_link_params'
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    failure = error ? `token_hash: ${error.code ?? error.message}` : null
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    failure = error ? `code: ${error.code ?? error.message}` : null
  }

  if (failure) {
    console.error('[auth/confirm] email link rejected:', failure)
    redirect(`/forgot-password?expired=1&reason=${encodeURIComponent(failure)}`)
  }
  redirect(next)
}

// Only allow same-site paths so a crafted link can't bounce users elsewhere.
function safeNext(next: string) {
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/reset-password'
  }
  return next
}
