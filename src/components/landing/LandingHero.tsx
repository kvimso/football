import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'

export async function LandingHero() {
  const { t, lang } = await getServerT()

  // Split the hero title to highlight "Georgian" in green
  const title = t('landing.heroTitle')
  const highlightWord = lang === 'ka' ? 'ქართული' : 'Georgian'
  const parts = title.split(highlightWord)

  return (
    <section className="overflow-hidden">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-8 lg:py-24">
          {/* Left — content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] sm:text-5xl lg:text-6xl">
              {parts.length > 1 ? (
                <>
                  {parts[0]}
                  <span className="text-primary">{highlightWord}</span>
                  {parts[1]}
                </>
              ) : (
                title
              )}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-foreground-secondary max-w-xl mx-auto lg:mx-0">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
              <Link href="/register" className="btn-primary px-8 py-3 text-base font-semibold">
                {t('nav.getStarted')} &rarr;
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-3 text-base font-semibold text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground"
              >
                {t('landing.heroLearnMore')}
              </Link>
            </div>
          </div>

          {/* Right — mock player card (dark theme preview of platform) */}
          <div className="flex items-center justify-center lg:justify-end" aria-hidden="true">
            <div
              className="relative hero-parallax"
              style={
                {
                  '--background': '#12110F',
                  '--surface': '#1C1A17',
                  '--foreground': '#EEECE8',
                  '--foreground-muted': '#9A9590',
                  '--primary': '#4ADE80',
                  '--border': '#2A2623',
                } as React.CSSProperties
              }
            >
              {/* Green gradient glow behind card */}
              <div className="absolute -inset-10 rounded-3xl bg-gradient-to-br from-primary/25 via-primary/8 to-transparent blur-3xl" />

              {/* Card — dark platform preview with rotation */}
              <div className="relative w-72 rotate-2 rounded-xl border border-border border-l-[3px] border-l-pos-mid bg-surface overflow-hidden shadow-2xl shadow-black/40 sm:w-80">
                {/* Card body */}
                <div className="p-6">
                  {/* Player silhouette */}
                  <div className="flex justify-center">
                    <div className="rounded-full bg-surface p-4">
                      <PlayerSilhouette size="sm" className="h-20 w-20 text-foreground-muted/40" />
                    </div>
                  </div>

                  {/* Name & info */}
                  <div className="mt-4 text-center">
                    <div className="text-lg font-bold text-foreground">
                      {t('landing.mockPlayerName')}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-2 text-sm text-foreground-muted">
                      <span className="inline-block h-2 w-2 rounded-full bg-pos-mid" />
                      <span>{t('landing.mockPosition')}</span>
                      <span className="text-border">|</span>
                      <span>{t('landing.mockAge')}</span>
                    </div>
                    <div className="mt-1 text-xs text-foreground-muted">
                      {t('landing.mockClub')}
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-background/60 p-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">12</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                        {t('landing.mockGoals')}
                      </div>
                    </div>
                    <div className="text-center border-x border-border">
                      <div className="text-xl font-bold text-primary">8</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                        {t('landing.mockAssists')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">24</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                        {t('landing.mockMatches')}
                      </div>
                    </div>
                  </div>

                  {/* Verified badge */}
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                    <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{t('landing.verifiedStats')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
