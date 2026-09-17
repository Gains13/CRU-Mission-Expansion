import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const NAV = [
  { href: '/manager/campuses', label: 'Campuses' },
  { href: '/manager/interns', label: 'Interns' },
  { href: '/manager/prospects', label: 'Prospects' },
  { href: '/manager/calls', label: 'Info calls' },
  { href: '/manager/reports', label: 'Reports' },
]

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="grid min-h-screen grid-cols-[236px_1fr]">
      <aside className="flex flex-col gap-5 border-r border-divider py-6">
        <div className="px-5">
          <div className="font-heading text-[10px] uppercase tracking-widest text-accent">
            Manager
          </div>
          <div className="mt-1 font-heading text-lg font-medium">Mission Expansion</div>
        </div>
        <div className="h-px bg-divider" />
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-r-md border-l-2 border-transparent px-3 py-2 text-sm text-ink hover:border-accent-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="p-10">{children}</main>
    </div>
  )
}