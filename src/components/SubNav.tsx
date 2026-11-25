'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isActive, type NavItem } from '@/components/TopNav'

export default function SubNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-6 overflow-x-auto border-b border-divider">
      {items.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 pb-2.5 text-sm ${
              active
                ? 'border-accent font-medium text-accent-800'
                : 'border-transparent text-neutral-700 hover:border-accent-300 hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
