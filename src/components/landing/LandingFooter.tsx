'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'

export function LandingFooter() {
  const { t } = useLang()

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* CTA strip */}
        <div className="mb-10 flex flex-col items-center gap-4 rounded-xl bg-accent/5 p-8 text-center sm:flex-row sm:justify-center sm:gap-6">
          <p className="font-semibold">{t('landing.footerTagline')}</p>
          <div className="flex gap-3">
            <Link href="/register" className="btn-primary text-sm">
              {t('landing.registerScout')}
            </Link>
            <Link href="/login" className="btn-secondary text-sm">
              {t('landing.registerAcademy')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-bold text-accent">
              GFT
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              {t('landing.footerTagline')}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold">{t('landing.footerPlatform')}</h4>
            <nav className="mt-3 flex flex-col gap-2">
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

          {/* For Scouts */}
          <div>
            <h4 className="text-sm font-semibold">{t('landing.footerForScouts')}</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/register" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('landing.footerCreateAccount')}
              </Link>
              <Link href="/login" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('landing.footerBrowsePlayers')}
              </Link>
            </nav>
          </div>

          {/* For Academies */}
          <div>
            <h4 className="text-sm font-semibold">{t('landing.footerForAcademies')}</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/login" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('landing.footerRegister')}
              </Link>
              <Link href="/about" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
                {t('landing.footerLearnMore')}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-foreground-muted">
            &copy; {new Date().getFullYear()} {t('footer.platformName')}. {t('footer.rights')}
          </p>
          <p className="text-xs text-foreground-muted">{t('footer.location')}</p>
        </div>
      </div>
    </footer>
  )
}
