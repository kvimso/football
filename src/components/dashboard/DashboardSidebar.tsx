'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

const links = [
  {
    href: '/dashboard',
    labelKey: 'dashboard.home',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    showMobile: true,
  },
  {
    href: '/dashboard/watchlist',
    labelKey: 'dashboard.watchlist',
    icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    showCount: true,
    showMobile: true,
  },
  {
    href: '/dashboard/messages',
    labelKey: 'dashboard.messages',
    showUnread: true,
    icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
    showMobile: true,
  },
]

const compareLink = {
  href: '/players/compare',
  labelKey: 'dashboard.compare',
  icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
}

interface DashboardSidebarProps {
  watchlistCount: number
  unreadCount: number
}

export function DashboardSidebar({
  watchlistCount: initialWatchlistCount,
  unreadCount: initialUnreadCount,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const { t } = useLang()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  // Realtime unread subscription (migrated from DashboardNav)
  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    // Initial fetch
    supabase.rpc('get_total_unread_count').then(({ data, error }) => {
      if (!error && data != null) setUnreadCount(Number(data))
    })

    let debounceTimer: NodeJS.Timeout
    const channel = supabase
      .channel('dashboard-sidebar-unread')
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

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop sidebar (lg: full labels, md: icon-only) */}
      <aside className="hidden shrink-0 md:block md:w-12 lg:w-[200px]">
        <div className="sticky top-[calc(var(--navbar-height)+2rem)]">
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={t(link.labelKey)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary border-l-[3px] border-primary'
                      : 'text-foreground-muted hover:text-foreground hover:bg-elevated'
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
                  <span className="hidden lg:inline">{t(link.labelKey)}</span>
                  {link.showCount && initialWatchlistCount > 0 && (
                    <span className="hidden lg:inline ml-auto text-xs text-foreground-muted">
                      {initialWatchlistCount}
                    </span>
                  )}
                  {link.showUnread && unreadCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              )
            })}

            {/* Divider */}
            <div className="my-2 h-px bg-border" />

            {/* Compare (external link) */}
            <Link
              href={compareLink.href}
              title={t(compareLink.labelKey)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-elevated transition-colors`}
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={compareLink.icon} />
              </svg>
              <span className="hidden lg:inline">{t(compareLink.labelKey)}</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex h-14 items-center justify-around border-t border-border bg-surface md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {links
          .filter((l) => l.showMobile)
          .map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-[64px] ${
                  active ? 'text-primary' : 'text-foreground-muted'
                }`}
              >
                <div className="relative">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {link.showUnread && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{t(link.labelKey)}</span>
              </Link>
            )
          })}
      </nav>
    </>
  )
}
