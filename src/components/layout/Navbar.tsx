'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const { t, lang, setLang } = useLang()
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { id: user.id, email: user.email ?? undefined } : null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
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
          <Link href="/players" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            {t('nav.players')}
          </Link>
          <Link href="/matches" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            {t('nav.matches')}
          </Link>
          <Link href="/clubs" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            {t('nav.clubs')}
          </Link>
          <Link href="/about" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
            {t('nav.about')}
          </Link>
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
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.logout')}
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
            <Link href="/players" onClick={() => setMenuOpen(false)} className="text-sm text-foreground-muted hover:text-foreground">
              {t('nav.players')}
            </Link>
            <Link href="/matches" onClick={() => setMenuOpen(false)} className="text-sm text-foreground-muted hover:text-foreground">
              {t('nav.matches')}
            </Link>
            <Link href="/clubs" onClick={() => setMenuOpen(false)} className="text-sm text-foreground-muted hover:text-foreground">
              {t('nav.clubs')}
            </Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="text-sm text-foreground-muted hover:text-foreground">
              {t('nav.about')}
            </Link>
            {user && (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm text-foreground-muted hover:text-foreground">
                {t('nav.dashboard')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
