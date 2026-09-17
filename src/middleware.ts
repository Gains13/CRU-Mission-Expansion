import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
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

  return response
}

export const config = {
  matcher: ['/intern/:path*', '/manager/:path*', '/developer/:path*'],
}