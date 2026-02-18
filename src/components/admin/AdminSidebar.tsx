'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'

const links = [
  { href: '/admin', labelKey: 'admin.nav.dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/players', labelKey: 'admin.nav.players', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/admin/transfers', labelKey: 'admin.nav.transfers', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
  { href: '/admin/requests', labelKey: 'admin.nav.requests', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
]

interface AdminSidebarProps {
  clubName: string
  clubNameKa: string
}

export function AdminSidebar({ clubName, clubNameKa }: AdminSidebarProps) {
  const pathname = usePathname()
  const { t, lang } = useLang()

  const displayName = lang === 'ka' && clubNameKa ? clubNameKa : clubName

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24">
          {displayName && (
            <div className="mb-4 rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-foreground-muted">{t('admin.title')}</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{displayName}</p>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const isActive = link.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-foreground-muted hover:bg-surface hover:text-foreground'
                  }`}
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {t(link.labelKey)}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px md:hidden">
        {links.map((link) => {
          const isActive = link.href === '/admin'
            ? pathname === '/admin'
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
    </>
  )
}
