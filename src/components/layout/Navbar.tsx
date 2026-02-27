'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'

const NAV_ICONS: Record<string, string> = {
  '/players': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  '/matches': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  '/clubs': 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  '/about': 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  '/contact': 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
}

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  const iconPath = NAV_ICONS[href]

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 py-1 text-sm transition-colors ${isActive ? 'text-accent font-medium' : 'text-foreground-muted hover:text-foreground'}`}
    >
      {iconPath && (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      )}
      {children}
      {isActive && (
        <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-accent rounded-full" />
      )}
    </Link>
  )
}

const ROLE_TRANSLATION_KEYS: Record<string, string> = {
  scout: 'roles.scout',
  academy_admin: 'roles.admin',
  platform_admin: 'roles.platform',
}

export function Navbar() {
  const { t, lang, setLang } = useLang()
  const { user, userRole, signOut } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    await signOut()
    router.push('/')
    router.refresh()
  }

  const dashboardHref = userRole === 'platform_admin' ? '/platform' : userRole === 'academy_admin' ? '/admin' : '/dashboard'
  const dashboardLabel = userRole === 'platform_admin' ? t('platform.title') : userRole === 'academy_admin' ? t('nav.admin') : t('nav.dashboard')

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-nav-bg/95 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="rounded bg-accent px-2 py-0.5 text-sm font-bold text-white">
          GFT
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-5 md:flex">
          {user && (
            <>
              <NavLink href="/players">{t('nav.players')}</NavLink>
              <NavLink href="/matches">{t('nav.matches')}</NavLink>
              <NavLink href="/clubs">{t('nav.clubs')}</NavLink>
            </>
          )}
          <NavLink href="/about">{t('nav.about')}</NavLink>
          <NavLink href="/contact">{t('nav.contact')}</NavLink>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2.5">
          {/* Language toggle */}
          <button
            onClick={() => {
              const newLang = lang === 'en' ? 'ka' : 'en'
              setLang(newLang)
              router.refresh()
            }}
            className="text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            <span className={lang === 'en' ? 'text-foreground' : ''}>EN</span>
            <span className="mx-0.5 text-border">|</span>
            <span className={lang === 'ka' ? 'text-foreground' : ''}>KA</span>
          </button>

          {user ? (
            <>
              {/* Dashboard link with role badge */}
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                {dashboardLabel}
                {userRole && (
                  <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    {t(ROLE_TRANSLATION_KEYS[userRole] ?? 'roles.scout')}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md border border-border px-3 py-1 text-xs text-foreground-muted hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {loggingOut ? t('common.loading') : t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
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
            className="md:hidden rounded-md p-1.5 text-foreground-muted hover:text-foreground transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-nav-bg px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            {user && (
              <>
                <NavLink href="/players" onClick={() => setMenuOpen(false)}>{t('nav.players')}</NavLink>
                <NavLink href="/matches" onClick={() => setMenuOpen(false)}>{t('nav.matches')}</NavLink>
                <NavLink href="/clubs" onClick={() => setMenuOpen(false)}>{t('nav.clubs')}</NavLink>
              </>
            )}
            <NavLink href="/about" onClick={() => setMenuOpen(false)}>{t('nav.about')}</NavLink>
            <NavLink href="/contact" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</NavLink>
            {user && (
              <NavLink href={dashboardHref} onClick={() => setMenuOpen(false)}>
                {dashboardLabel}
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
