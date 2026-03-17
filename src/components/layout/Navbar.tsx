'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from './ThemeToggle'
import { AvatarDropdown } from './AvatarDropdown'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 py-1 text-sm transition-colors ${isActive ? 'text-primary font-medium' : 'text-foreground-muted hover:text-foreground'}`}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  )
}

interface NavbarProps {
  showInfoLinks?: boolean
}

export function Navbar({ showInfoLinks = false }: NavbarProps) {
  const { t } = useLang()
  const { user, userRole } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Close mobile menu on viewport resize crossing md breakpoint
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const handler = () => {
      if (mql.matches) setMenuOpen(false)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Poll unread message count every 30s
  useEffect(() => {
    if (!user || userRole === 'platform_admin') return
    let cancelled = false
    const supabase = createClient()

    const fetchUnread = () => {
      supabase.rpc('get_total_unread_count').then(({ data, error }) => {
        if (!error && data != null && !cancelled) setUnreadCount(Number(data))
      })
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 30_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user, userRole])

  const closeMobile = useCallback(() => setMenuOpen(false), [])

  const dashboardHref =
    userRole === 'platform_admin'
      ? '/platform'
      : userRole === 'academy_admin'
        ? '/admin'
        : '/dashboard'

  const messagesHref = userRole === 'academy_admin' ? '/admin/messages' : '/dashboard/messages'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-nav-bg shadow-sm">
      <nav className="mx-auto grid h-12 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4">
        {/* Logo — left */}
        <div className="flex items-center">
          <Link
            href={user ? dashboardHref : '/'}
            className="rounded bg-primary px-2 py-0.5 text-sm font-bold text-btn-primary-text"
            title={user ? t('nav.dashboard') : undefined}
          >
            GFT
          </Link>
        </div>

        {/* Desktop nav links — center */}
        <div className="hidden items-center gap-5 md:flex">
          {user && (
            <>
              <NavLink href="/players">{t('nav.players')}</NavLink>
              <NavLink href="/matches">{t('nav.matches')}</NavLink>
              <NavLink href="/clubs">{t('nav.clubs')}</NavLink>
            </>
          )}
          {showInfoLinks && (
            <>
              <NavLink href="/about">{t('nav.about')}</NavLink>
              <NavLink href="/contact">{t('nav.contact')}</NavLink>
            </>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center justify-end gap-2">
          <LanguageToggle />

          {user ? (
            <>
              <NotificationBell />

              {/* Messages link with green dot */}
              {userRole !== 'platform_admin' && (
                <Link
                  href={messagesHref}
                  className="relative hidden items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors md:flex"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                  {t('nav.messages')}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Link>
              )}

              <ThemeToggle />
              <AvatarDropdown />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                href="/login"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                {t('nav.register')}
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            onKeyDown={(e) => e.key === 'Escape' && setMenuOpen(false)}
            className="md:hidden rounded-md p-1.5 text-foreground-muted hover:text-foreground transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu — animated via CSS grid-rows */}
      <div
        id="mobile-menu"
        className={`grid transition-[grid-template-rows] duration-200 ease-out md:hidden ${
          menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border bg-nav-bg px-4 py-3">
            <div className="flex flex-col gap-2">
              {/* Platform links */}
              {user && (
                <>
                  <NavLink href="/players" onClick={closeMobile}>
                    {t('nav.players')}
                  </NavLink>
                  <NavLink href="/matches" onClick={closeMobile}>
                    {t('nav.matches')}
                  </NavLink>
                  <NavLink href="/clubs" onClick={closeMobile}>
                    {t('nav.clubs')}
                  </NavLink>
                </>
              )}
              {showInfoLinks && (
                <>
                  <NavLink href="/about" onClick={closeMobile}>
                    {t('nav.about')}
                  </NavLink>
                  <NavLink href="/contact" onClick={closeMobile}>
                    {t('nav.contact')}
                  </NavLink>
                </>
              )}

              {user && (
                <>
                  {/* Separator */}
                  <div className="border-t border-border my-1" />

                  {/* Your Space links */}
                  <NavLink href={dashboardHref} onClick={closeMobile}>
                    {userRole === 'platform_admin'
                      ? t('platform.title')
                      : userRole === 'academy_admin'
                        ? t('nav.admin')
                        : t('nav.dashboard')}
                  </NavLink>
                  {userRole === 'scout' && (
                    <NavLink href="/dashboard/watchlist" onClick={closeMobile}>
                      {t('watchlist.watching')}
                    </NavLink>
                  )}
                  {userRole !== 'platform_admin' && (
                    <NavLink href={messagesHref} onClick={closeMobile}>
                      {t('nav.messages')}
                      {unreadCount > 0 && (
                        <span className="ml-1.5 h-2 w-2 rounded-full bg-primary inline-block" />
                      )}
                    </NavLink>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
