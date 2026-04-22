'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'
import { AvatarDropdown } from './AvatarDropdown'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

/** Desktop center link — plain styling matching LandingNav exactly */
function CenterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        isActive ? 'font-medium text-primary' : 'text-foreground-muted hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  )
}

/** Mobile menu link — keeps underline indicator + onClick */
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
      className={`text-sm transition-colors ${isActive ? 'text-primary font-medium' : 'text-foreground-muted hover:text-foreground'}`}
    >
      {children}
    </Link>
  )
}

export function Navbar() {
  const { t } = useLang()
  const { user, userRole, isApproved } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Derive nav visibility flags
  const showPublicLinks = !user
  const showRequestDemo = !user || (userRole === 'scout' && !isApproved)
  const showMessages =
    !!user && userRole !== 'platform_admin' && !(userRole === 'scout' && !isApproved)
  const showAdmin = userRole === 'academy_admin'

  // Close mobile menu on viewport resize crossing md breakpoint
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const handler = () => {
      if (mql.matches) setMenuOpen(false)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Poll unread message count every 30s — only when Messages link is visible
  useEffect(() => {
    if (!showMessages) return
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
  }, [showMessages])

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
            className="text-lg font-bold tracking-tight text-foreground transition-colors hover:text-primary"
            style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
            title={user ? t('nav.dashboard') : undefined}
          >
            Binocly
          </Link>
        </div>

        {/* Desktop nav links — center (plain Links to match LandingNav exactly) */}
        <div className="hidden items-center gap-5 md:flex">
          {showPublicLinks && (
            <>
              <CenterLink href="/leagues">{t('nav.leagues')}</CenterLink>
              <CenterLink href="/about">{t('nav.about')}</CenterLink>
              <CenterLink href="/contact">{t('nav.contact')}</CenterLink>
            </>
          )}
          {user && userRole === 'scout' && (
            <>
              <CenterLink href="/app/players">Players</CenterLink>
              <CenterLink href="/app/clubs">Clubs</CenterLink>
              <CenterLink href="/app/schedule">Schedule</CenterLink>
              <CenterLink href="/app/standings">Standings</CenterLink>
              <CenterLink href="/app/leagues">Leagues</CenterLink>
            </>
          )}
          {showRequestDemo && user && <CenterLink href="/demo">{t('nav.requestDemo')}</CenterLink>}
          {showMessages && (
            <CenterLink href={messagesHref}>
              {t('nav.messages')}
              {unreadCount > 0 && (
                <span className="ml-1 h-2 w-2 rounded-full bg-primary inline-block" />
              )}
            </CenterLink>
          )}
          {showAdmin && <CenterLink href="/admin">{t('nav.admin')}</CenterLink>}
        </div>

        {/* Right side actions */}
        <div className="flex items-center justify-end gap-2">
          <LanguageToggle />

          {user ? (
            <>
              <ThemeToggle />
              <AvatarDropdown />
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                href="/login"
                className="text-[11px] font-semibold uppercase tracking-widest text-foreground-faint transition-colors hover:text-foreground"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_88%,black)]"
              >
                {t('nav.requestDemo')}
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
              {showPublicLinks && (
                <>
                  <NavLink href="/leagues" onClick={closeMobile}>
                    {t('nav.leagues')}
                  </NavLink>
                  <NavLink href="/about" onClick={closeMobile}>
                    {t('nav.about')}
                  </NavLink>
                  <NavLink href="/contact" onClick={closeMobile}>
                    {t('nav.contact')}
                  </NavLink>
                </>
              )}
              {showRequestDemo && user && (
                <NavLink href="/demo" onClick={closeMobile}>
                  {t('nav.requestDemo')}
                </NavLink>
              )}

              {user && (
                <>
                  <div className="border-t border-border my-1" />
                  <NavLink href={dashboardHref} onClick={closeMobile}>
                    {userRole === 'platform_admin'
                      ? t('platform.title')
                      : userRole === 'academy_admin'
                        ? t('nav.admin')
                        : t('nav.dashboard')}
                  </NavLink>
                  {userRole === 'scout' && (
                    <>
                      <NavLink href="/app/players" onClick={closeMobile}>
                        Players
                      </NavLink>
                      <NavLink href="/app/clubs" onClick={closeMobile}>
                        Clubs
                      </NavLink>
                      <NavLink href="/app/schedule" onClick={closeMobile}>
                        Schedule
                      </NavLink>
                      <NavLink href="/app/standings" onClick={closeMobile}>
                        Standings
                      </NavLink>
                      <NavLink href="/app/leagues" onClick={closeMobile}>
                        Leagues
                      </NavLink>
                    </>
                  )}
                  {showMessages && (
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
