'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', labelKey: 'dashboard.title' },
  { href: '/dashboard/shortlist', labelKey: 'dashboard.shortlist' },
  { href: '/dashboard/messages', labelKey: 'dashboard.messages', showUnread: true },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { t } = useLang()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    supabase.rpc('get_total_unread_count').then(({ data, error }) => {
      if (!error && data != null) setUnreadCount(Number(data))
    })

    let debounceTimer: NodeJS.Timeout
    const channel = supabase
      .channel('dashboard-nav-unread')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          supabase.rpc('get_total_unread_count').then(({ data, error }) => {
            if (!error && data != null) setUnreadCount(Number(data))
          })
        }, 500)
      })
      .subscribe()

    return () => {
      clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [user])

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
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-b-2 border-accent text-accent'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {t(link.labelKey)}
            {link.showUnread && unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
