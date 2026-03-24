'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'

export function Footer() {
  const { t } = useLang()

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-block rounded bg-primary px-2 py-0.5 text-sm font-bold text-background"
            >
              GFT
            </Link>
            <span className="text-xs text-foreground-faint">{t('footer.location')}</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
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
            <Link
              href="/privacy"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {t('footer.terms')}
            </Link>
            <Link
              href="/demo"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {t('footer.requestDemo')}
            </Link>
          </nav>

          {/* Contact */}
          <a
            href="mailto:info@gft.ge"
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            info@gft.ge
          </a>
        </div>

        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-foreground-faint">
          &copy; {new Date().getFullYear()} {t('footer.platformName')}. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
