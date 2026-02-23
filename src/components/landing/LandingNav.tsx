'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'

export function LandingNav() {
  const { t, lang, setLang } = useLang()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-nav-bg/95 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-accent">
          GFT
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/about"
            className={`text-sm transition-colors ${
              pathname === '/about' ? 'font-medium text-accent' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {t('nav.about')}
          </Link>
          <Link
            href="/contact"
            className={`text-sm transition-colors ${
              pathname === '/contact' ? 'font-medium text-accent' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {t('nav.contact')}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newLang = lang === 'en' ? 'ka' : 'en'
              setLang(newLang)
              router.refresh()
            }}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            {lang === 'en' ? 'ქარ' : 'ENG'}
          </button>

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
                {t('nav.register')}
              </Link>
            </>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-1.5 text-foreground-muted hover:text-foreground transition-colors md:hidden"
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
