'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function LandingNav() {
  const { t } = useLang()
  const pathname = usePathname()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close mobile menu on viewport resize crossing md breakpoint
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const handler = () => {
      if (mql.matches) setMenuOpen(false)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-nav-bg shadow-sm">
      <nav className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="rounded bg-primary px-2 py-0.5 text-sm font-bold text-btn-primary-text"
        >
          GFT
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/about"
            className={`text-sm transition-colors ${
              pathname === '/about'
                ? 'font-medium text-primary'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {t('nav.about')}
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <ThemeToggle />

          {user ? (
            <Link href="/players" className="btn-primary text-sm">
              {t('landing.footerBrowsePlayers')}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                {t('nav.getStarted')} &rarr;
              </Link>
            </>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-1.5 text-foreground-muted hover:text-foreground transition-colors md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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

      {menuOpen && (
        <div className="border-t border-border bg-nav-bg px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {t('nav.about')}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {t('nav.contact')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
