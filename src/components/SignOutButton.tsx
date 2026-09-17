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
      className="rounded-r-md border-l-2 border-transparent px-3 py-2 text-left text-sm text-neutral-700 hover:border-accent-300 hover:text-ink"
    >
      Sign out
    </button>
  )
}