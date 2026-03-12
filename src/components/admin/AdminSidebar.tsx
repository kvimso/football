'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

const links = [
  {
    href: '/admin',
    labelKey: 'admin.nav.dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/admin/players',
    labelKey: 'admin.nav.players',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    href: '/admin/transfers',
    labelKey: 'admin.nav.transfers',
    icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  },
  {
    href: '/admin/messages',
    labelKey: 'admin.nav.messages',
    showUnread: true,
    icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  },
  {
    href: '/admin/announcements',
    labelKey: 'admin.nav.announcements',
    icon: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
  },
]

interface AdminSidebarProps {
  clubName: string
  clubNameKa: string
}

export function AdminSidebar({ clubName, clubNameKa }: AdminSidebarProps) {
  const pathname = usePathname()
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const displayName = lang === 'ka' && clubNameKa ? clubNameKa : clubName

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    supabase.rpc('get_total_unread_count').then(({ data, error }) => {
      if (!error && data != null) setUnreadCount(Number(data))
    })

    let debounceTimer: NodeJS.Timeout
    const channel = supabase
      .channel('admin-sidebar-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            supabase.rpc('get_total_unread_count').then(({ data, error }) => {
              if (!error && data != null) setUnreadCount(Number(data))
            })
          }, 500)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [user])

  const renderUnreadBadge = (link: (typeof links)[number]) => {
    if (!link.showUnread || unreadCount <= 0) return null
    return (
      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24">
          {displayName && (
            <div className="mb-4 rounded-lg border border-border bg-background-secondary p-3 border-l-4 border-l-accent">
              <p className="text-xs text-foreground-muted">{t('admin.title')}</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{displayName}</p>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const isActive =
                link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent/15 text-accent border-l-2 border-accent'
                      : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
                  }`}
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {t(link.labelKey)}
                  {renderUnreadBadge(link)}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px md:hidden">
        {links.map((link) => {
          const isActive =
            link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {t(link.labelKey)}
              {renderUnreadBadge(link)}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
