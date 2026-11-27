'use client'

import { useEffect } from 'react'

// Email links can land on the wrong page with the session (or an error) in
// the #fragment, which the server never sees: Supabase falls back to the Site
// URL when it can't use the requested redirect, and if the person is already
// signed in the home page then redirects to their portal (keeping the
// fragment). Mounted in the root layout so it catches these on any page and
// forwards them to the page that handles them.
export default function EmailLinkForwarder() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || window.location.pathname === '/reset-password') return
    const params = new URLSearchParams(hash.slice(1))

    const type = params.get('type')
    if ((type === 'recovery' || type === 'invite') && params.get('access_token')) {
      window.location.replace(`/reset-password${type === 'invite' ? '?welcome=1' : ''}${hash}`)
      return
    }
    const linkError = params.get('error_code') ?? params.get('error')
    if (linkError) {
      window.location.replace(`/forgot-password?expired=1&reason=${encodeURIComponent(linkError.slice(0, 60))}`)
    }
  }, [])

  return null
}
