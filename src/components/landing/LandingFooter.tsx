import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export async function LandingFooter() {
  const { t } = await getServerT()

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-bold text-primary">
              Binocly
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
              {t('landing.footerTagline')}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold">{t('landing.footerPlatform')}</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link
                href="/leagues"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.leagues')}
              </Link>
              <Link
                href="/about"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.about')}
              </Link>
              <Link
                href="/contact"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.contact')}
              </Link>
            </nav>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="text-sm font-semibold">{t('landing.footerForScouts')}</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link
                href="/demo"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.requestDemo')}
              </Link>
              <Link
                href="/login"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('nav.login')}
              </Link>
            </nav>
          </div>

          {/* For Academies */}
          <div>
            <h4 className="text-sm font-semibold">{t('landing.footerForAcademies')}</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('landing.footerRegister')}
              </Link>
              <Link
                href="/about"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                {t('landing.footerLearnMore')}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-foreground-faint">
            &copy; {new Date().getFullYear()} {t('footer.platformName')}. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-foreground-faint hover:text-foreground-muted transition-colors"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              href="/terms"
              className="text-xs text-foreground-faint hover:text-foreground-muted transition-colors"
            >
              {t('footer.terms')}
            </Link>
            <span className="text-xs text-foreground-faint">{t('footer.location')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
