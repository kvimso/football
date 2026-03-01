'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'

const links = [
  { href: '/dashboard', labelKey: 'dashboard.title' },
  { href: '/dashboard/shortlist', labelKey: 'dashboard.shortlist' },
  { href: '/dashboard/messages', labelKey: 'dashboard.messages' },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { t } = useLang()

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {links.map((link) => {
        const isActive = link.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-b-2 border-accent text-accent'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {t(link.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
