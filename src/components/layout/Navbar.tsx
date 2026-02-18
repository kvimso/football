'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { createClient } from '@/lib/supabase/client'

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm transition-colors ${isActive ? 'text-accent font-medium' : 'text-foreground-muted hover:text-foreground'}`}
    >
      {children}
    </Link>
  )
}

export function Navbar() {
  const { t, lang, setLang } = useLang()
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    try {
      const supabase = createClient()

      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user ? { id: user.id, email: user.email ?? undefined } : null)
      }).catch(() => { /* env vars missing or network error */ })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null)
      })

      return () => subscription.unsubscribe()
    } catch {
      // Supabase client failed to initialize (missing env vars)
    }
  }, [])

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-accent">
          GFT
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLink href="/players">{t('nav.players')}</NavLink>
          <NavLink href="/matches">{t('nav.matches')}</NavLink>
          <NavLink href="/clubs">{t('nav.clubs')}</NavLink>
          <NavLink href="/about">{t('nav.about')}</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'ka' : 'en')}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            {lang === 'en' ? 'ქარ' : 'ENG'}
          </button>

          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('nav.dashboard')}
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {loggingOut ? t('common.loading') : t('nav.logout')}
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              {t('nav.login')}
            </Link>
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
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLink href="/players" onClick={() => setMenuOpen(false)}>{t('nav.players')}</NavLink>
            <NavLink href="/matches" onClick={() => setMenuOpen(false)}>{t('nav.matches')}</NavLink>
            <NavLink href="/clubs" onClick={() => setMenuOpen(false)}>{t('nav.clubs')}</NavLink>
            <NavLink href="/about" onClick={() => setMenuOpen(false)}>{t('nav.about')}</NavLink>
            {user && (
              <NavLink href="/dashboard" onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
