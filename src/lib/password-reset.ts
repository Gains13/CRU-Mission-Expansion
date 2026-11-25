import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const MIN_PASSWORD_LENGTH = 8

// Reset emails are requested with Supabase's implicit flow, so the link in
// the email carries the recovery session in its #fragment and works in any
// browser. (The app's normal PKCE client would tie the link to the browser
// that requested it, and Supabase's default email template can't be changed
// to the token_hash style without custom SMTP.)
let resetClient: SupabaseClient | null = null

function getResetClient() {
  resetClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'cru-password-reset-request',
      },
    },
  )
  return resetClient
}

// Must be called in the browser.
export function sendPasswordResetEmail(email: string) {
  return getResetClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}
