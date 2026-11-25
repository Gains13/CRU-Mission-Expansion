import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopNav from '@/components/TopNav'

const NAV = [
  { href: '/manager/campuses', label: 'Campuses' },
  { href: '/manager/interns', label: 'Interns' },
  { href: '/manager/prospects', label: 'Prospects' },
  { href: '/manager/calls', label: 'Info calls' },
  { href: '/manager/reports', label: 'Reports' },
]

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <TopNav role="Manager" items={NAV} root="/manager" />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">{children}</main>
    </div>
  )
}
