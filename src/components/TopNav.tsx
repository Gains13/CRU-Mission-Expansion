'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'
import IdleSignOut from '@/components/IdleSignOut'

export type NavItem = { href: string; label: string }

export function isActive(pathname: string, href: string, root?: string) {
  // A section's landing route (e.g. /intern) should only match exactly,
  // otherwise it would light up for every page beneath it.
  if (href === root) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function TopNav({
  role,
  items,
  root,
}: {
  role: string
  items: NavItem[]
  root: string
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
      <IdleSignOut />
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 rounded-2xl border border-divider/60 bg-white px-4 font-ui shadow-[0_4px_20px_rgba(32,31,29,0.08)] sm:gap-8 sm:px-6">
        <Link href={root} className="flex shrink-0 items-center gap-3" aria-label={`Cru Mission Expansion — ${role}`}>
          <Image src="/cru-logo.png" alt="Cru" width={988} height={606} priority className="h-9 w-auto" />
          <span className="hidden h-6 w-px bg-divider sm:block" />
          <span className="hidden text-[11px] font-medium uppercase tracking-widest text-neutral-600 sm:block">
            {role}
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {items.map((item) => {
            const active = isActive(pathname, item.href, root)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-accent-100 text-accent-800' : 'text-neutral-800 hover:bg-neutral-100 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0">
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
