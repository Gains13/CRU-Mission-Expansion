// "Keep me signed in" preference.
//
// Supabase's sign-in cookies normally last 400 days, so people stay signed in
// until they sign out. When someone unticks "Keep me signed in", we drop the
// expiry from those cookies as they're written, turning them into browser-
// session cookies that are cleared when the browser is closed. The choice is
// stored in its own cookie so every place that writes sign-in cookies (the
// browser, server pages and the middleware) can apply it, including when
// Supabase refreshes the session in the background.

export const REMEMBER_COOKIE = 'cru-remember'

type CookieOpts = { maxAge?: number; expires?: Date } & Record<string, unknown>

// `rememberValue` is the raw value of REMEMBER_COOKIE; anything other than
// '0' (including missing) means "keep me signed in", the default.
export function applyRememberPreference<T extends CookieOpts>(options: T, rememberValue: string | undefined): T {
  const forgetOnClose = rememberValue === '0'
  // maxAge 0 means "delete this cookie" — always leave deletions alone.
  if (!forgetOnClose || options.maxAge === 0) return options
  const sessionOnly = { ...options }
  delete sessionOnly.maxAge
  delete sessionOnly.expires
  return sessionOnly
}

// Browser only: records the choice before signing in.
export function saveRememberPreference(remember: boolean) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${REMEMBER_COOKIE}=${remember ? '1' : '0'}; Path=/; Max-Age=${400 * 24 * 60 * 60}; SameSite=Lax${secure}`
}

// Browser only: whether the person chose "Keep me signed in" last time
// (defaults to true).
export function readRememberPreference() {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${REMEMBER_COOKIE}=([^;]*)`))
  return match?.[1] !== '0'
}
