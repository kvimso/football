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

  const navLinks = [
    { href: '/#for-scouts', label: t('nav.forScouts') },
    { href: '/#for-academies', label: t('nav.forAcademies') },
    { href: '/about', label: t('nav.about'), isActive: pathname === '/about' },
  ]

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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                link.isActive
                  ? 'font-medium text-primary'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
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
            onKeyDown={(e) => e.key === 'Escape' && setMenuOpen(false)}
            className="rounded-md p-1.5 text-foreground-muted hover:text-foreground transition-colors md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
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
        id="landing-mobile-menu"
        className={`grid transition-[grid-template-rows] duration-200 ease-out md:hidden ${
          menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border bg-nav-bg px-4 py-3">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.contact')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
