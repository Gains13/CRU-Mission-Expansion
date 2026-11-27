import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  LAST_ACTIVE_COOKIE,
  REMEMBER_COOKIE,
  applyRememberPreference,
  isIdleExpired,
} from '@/lib/remember-me'

const PROTECTED_ROLES = ['intern', 'manager', 'developer'] as const
type Role = (typeof PROTECTED_ROLES)[number]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard the three portal areas — everything else (login, signup, home) passes through
  const matchedRole = PROTECTED_ROLES.find((role) => pathname.startsWith(`/${role}`))
  if (!matchedRole) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          const remember = request.cookies.get(REMEMBER_COOKIE)?.value
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, applyRememberPreference(options, remember))
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not signed in at all — send to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Didn't choose "Keep me signed in" and idle past the limit (e.g. reopened
  // the browser later) — sign out and explain on the login page.
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value
  if (isIdleExpired(remember, request.cookies.get(LAST_ACTIVE_COOKIE)?.value)) {
    await supabase.auth.signOut({ scope: 'local' })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = '?signedOut=idle'
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    redirect.cookies.delete(LAST_ACTIVE_COOKIE)
    return redirect
  }

  // Signed in — check their actual role matches the portal they're trying to reach
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const actualRole = profile?.role as Role | undefined

  if (!actualRole || actualRole !== matchedRole) {
    // Signed in, but wrong portal — bounce them to the one they actually belong in
    const url = request.nextUrl.clone()
    url.pathname = actualRole ? `/${actualRole}` : '/login'
    return NextResponse.redirect(url)
  }

  // A real page visit counts as activity; link prefetches don't.
  const isPrefetch =
    request.headers.get('next-router-prefetch') !== null || request.headers.get('purpose') === 'prefetch'
  if (remember === '0' && !isPrefetch) {
    response.cookies.set(LAST_ACTIVE_COOKIE, String(Date.now()), {
      path: '/',
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    })
  }

  return response
}

export const config = {
  matcher: ['/intern/:path*', '/manager/:path*', '/developer/:path*'],
}