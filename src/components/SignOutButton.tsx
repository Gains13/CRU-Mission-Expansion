'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg bg-accent px-4 py-2 font-ui text-sm font-semibold text-white transition-colors hover:bg-accent-600"
    >
      Sign out
    </button>
  )
}
