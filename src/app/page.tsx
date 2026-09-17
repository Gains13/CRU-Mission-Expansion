import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Already signed in — skip the landing page, go straight to their portal
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      redirect(`/${profile.role}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 px-8 text-center">
      <div className="font-heading text-xs uppercase tracking-widest text-accent">
        Mission Expansion
      </div>
      <h1 className="max-w-2xl font-heading text-5xl leading-tight tracking-tight">
        Cru Mission
        <br />
        Expansion Launch
      </h1>
      <div className="h-px w-16 bg-accent" />
      <p className="max-w-md text-neutral-800">
        One structured pipeline from campus research to the students who could
        help launch a movement.
      </p>
      <Link
        href="/login"
        className="rounded-md border border-accent px-6 py-3 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100"
      >
        Sign in
      </Link>
    </div>
  )
}