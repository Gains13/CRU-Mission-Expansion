'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IDLE_SIGNED_OUT_PATH, idleExpiredNow, markActive, readRememberPreference } from '@/lib/remember-me'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const
const RECORD_EVERY_MS = 30 * 1000
const CHECK_EVERY_MS = 30 * 1000

// Signs out people who chose not to stay signed in once they've been idle
// for 10 minutes (activity in any tab counts — the timestamp is a shared
// cookie). Does nothing for people who ticked "Keep me signed in".
export default function IdleSignOut() {
  useEffect(() => {
    if (readRememberPreference()) return

    const supabase = createClient()
    let lastRecorded = 0
    let signingOut = false

    async function signOutIfIdle() {
      if (signingOut || !idleExpiredNow()) return
      signingOut = true
      await supabase.auth.signOut({ scope: 'local' })
      window.location.replace(IDLE_SIGNED_OUT_PATH)
    }

    function onActivity() {
      const now = Date.now()
      if (now - lastRecorded < RECORD_EVERY_MS) return
      // Coming back to a tab that's already past the limit signs out rather
      // than reviving the session.
      if (idleExpiredNow()) {
        signOutIfIdle()
        return
      }
      lastRecorded = now
      markActive(now)
    }

    function onVisible() {
      if (document.visibilityState === 'visible') signOutIfIdle()
    }

    signOutIfIdle()
    onActivity()
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(signOutIfIdle, CHECK_EVERY_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [])

  return null
}
