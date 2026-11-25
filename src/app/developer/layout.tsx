import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopNav from '@/components/TopNav'

const NAV = [
  { href: '/developer/flags', label: 'Feature flags' },
  { href: '/developer/releases', label: 'Releases' },
  { href: '/developer/accounts', label: 'Accounts & roles' },
  { href: '/developer/environment', label: 'Password & environment' },
]

export default async function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <TopNav role="Development" items={NAV} root="/developer" />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">{children}</main>
    </div>
  )
}
