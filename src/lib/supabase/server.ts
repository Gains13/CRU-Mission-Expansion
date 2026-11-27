import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { REMEMBER_COOKIE, applyRememberPreference } from '@/lib/remember-me'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          const remember = cookieStore.get(REMEMBER_COOKIE)?.value
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, applyRememberPreference(options, remember))
            )
          } catch {
            // called from a Server Component — safe to ignore if you
            // have middleware refreshing sessions
          }
        },
      },
    }
  )
}