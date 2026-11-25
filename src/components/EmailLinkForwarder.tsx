'use client'

import { useEffect } from 'react'

// If Supabase can't use the requested redirect, it sends email links to the
// Site URL (this home page) with the result in the #fragment, which the
// server never sees. Forward those to the page that can handle them.
export default function EmailLinkForwarder() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.slice(1))

    if (params.get('type') === 'recovery' && params.get('access_token')) {
      window.location.replace(`/reset-password${hash}`)
      return
    }
    const linkError = params.get('error_code') ?? params.get('error')
    if (linkError) {
      window.location.replace(`/forgot-password?expired=1&reason=${encodeURIComponent(linkError.slice(0, 60))}`)
    }
  }, [])

  return null
}
