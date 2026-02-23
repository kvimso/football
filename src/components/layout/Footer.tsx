'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'

export function Footer() {
  const { t } = useLang()

  return (
    <footer className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block rounded bg-accent px-2 py-0.5 text-sm font-bold text-white">
              GFT
            </Link>
            <p className="mt-2 text-sm text-foreground-muted">
              {t('footer.platformName')}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">{t('nav.players')}</h4>
            <nav className="mt-2 flex flex-col gap-1.5">
              <Link href="/players" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('players.title')}
              </Link>
              <Link href="/matches" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('nav.matches')}
              </Link>
              <Link href="/clubs" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('nav.clubs')}
              </Link>
            </nav>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">{t('nav.about')}</h4>
            <nav className="mt-2 flex flex-col gap-1.5">
              <Link href="/about" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('nav.about')}
              </Link>
              <Link href="/contact" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('nav.contact')}
              </Link>
              <Link href="/login" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('nav.login')}
              </Link>
              <Link href="/register" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('nav.register')}
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">{t('footer.contact')}</h4>
            <p className="mt-2 text-sm text-foreground-muted">info@gft.ge</p>
            <p className="mt-1 text-sm text-foreground-muted">{t('footer.location')}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-foreground-muted">
          &copy; {new Date().getFullYear()} {t('footer.platformName')}. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
