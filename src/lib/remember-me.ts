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

// ---------------------------------------------------------------------------
// Idle sign-out for people who chose NOT to stay signed in.
//
// Browsers don't reliably clear session cookies on close (Chrome's "Continue
// where you left off" restores them), so we also enforce an inactivity limit:
// LAST_ACTIVE_COOKIE holds the last time they used the app, in any tab. The
// middleware signs them out on the next portal request once it's older than
// the limit (e.g. after reopening the browser), and IdleSignOut does it in an
// open tab that's been left alone.

export const LAST_ACTIVE_COOKIE = 'cru-last-active'
export const IDLE_LIMIT_MINUTES = 30
export const IDLE_LIMIT_MS = IDLE_LIMIT_MINUTES * 60 * 1000

// A missing timestamp counts as active: if session cookies really were
// cleared on close, the sign-in is gone anyway.
export function isIdleExpired(rememberValue: string | undefined, lastActive: string | undefined, now = Date.now()) {
  if (rememberValue !== '0' || !lastActive) return false
  const last = Number(lastActive)
  return !Number.isFinite(last) || now - last > IDLE_LIMIT_MS
}

export const IDLE_SIGNED_OUT_PATH = '/login?signedOut=idle'

function readCookie(name: string) {
  return document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1]
}

function writeCookie(name: string, value: string, maxAgeSeconds?: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const maxAge = maxAgeSeconds === undefined ? '' : `; Max-Age=${maxAgeSeconds}`
  document.cookie = `${name}=${value}; Path=/${maxAge}; SameSite=Lax${secure}`
}

// Browser only: records the choice before signing in, and starts the
// activity clock.
export function saveRememberPreference(remember: boolean) {
  writeCookie(REMEMBER_COOKIE, remember ? '1' : '0', 400 * 24 * 60 * 60)
  markActive()
}

// Browser only: whether the person chose "Keep me signed in" last time
// (defaults to true).
export function readRememberPreference() {
  return readCookie(REMEMBER_COOKIE) !== '0'
}

// Browser only.
export function markActive(now = Date.now()) {
  writeCookie(LAST_ACTIVE_COOKIE, String(now))
}

// Browser only.
export function idleExpiredNow() {
  return isIdleExpired(readCookie(REMEMBER_COOKIE), readCookie(LAST_ACTIVE_COOKIE))
}
