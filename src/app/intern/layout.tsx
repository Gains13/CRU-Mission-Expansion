import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopNav from '@/components/TopNav'

const NAV = [
  { href: '/intern', label: 'Home' },
  { href: '/intern/students', label: 'Students' },
  { href: '/intern/campuses', label: 'Campus workspace' },
]

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <TopNav role="Intern" items={NAV} root="/intern" />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">{children}</main>
    </div>
  )
}
