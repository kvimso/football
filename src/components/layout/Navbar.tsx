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
            className="rounded bg-primary px-2 py-0.5 text-sm font-bold text-btn-primary-text"
            title={user ? t('nav.dashboard') : undefined}
          >
            GFT
          </Link>
        </div>

        {/* Desktop nav links — center */}
        <div className="hidden items-center gap-5 md:flex">
          <NavLink href="/leagues">{t('nav.leagues')}</NavLink>
          {showPublicLinks && (
            <>
              <NavLink href="/about">{t('nav.about')}</NavLink>
              <NavLink href="/contact">{t('nav.contact')}</NavLink>
            </>
          )}
          {showRequestDemo && <NavLink href="/demo">{t('nav.requestDemo')}</NavLink>}
          {showMessages && (
            <NavLink href={messagesHref}>
              {t('nav.messages')}
              {unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-primary" />}
            </NavLink>
          )}
          {showAdmin && <NavLink href="/admin">{t('nav.admin')}</NavLink>}
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
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link href="/demo" className="btn-primary text-sm">
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
              <NavLink href="/leagues" onClick={closeMobile}>
                {t('nav.leagues')}
              </NavLink>
              {showPublicLinks && (
                <>
                  <NavLink href="/about" onClick={closeMobile}>
                    {t('nav.about')}
                  </NavLink>
                  <NavLink href="/contact" onClick={closeMobile}>
                    {t('nav.contact')}
                  </NavLink>
                </>
              )}
              {showRequestDemo && (
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
