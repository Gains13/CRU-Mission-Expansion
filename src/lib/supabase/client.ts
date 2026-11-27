import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { REMEMBER_COOKIE, applyRememberPreference } from '@/lib/remember-me'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Same as the library's built-in document.cookie handling, except
      // sign-in cookies honour the "Keep me signed in" choice.
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          return parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? '' }))
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return
          const remember = parseCookieHeader(document.cookie).find((c) => c.name === REMEMBER_COOKIE)?.value
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookieHeader(name, value, applyRememberPreference(options, remember))
          })
        },
      },
    }
  )
}
