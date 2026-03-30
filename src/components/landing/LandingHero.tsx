import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
import { HeroPlayerSlider } from '@/components/landing/HeroPlayerSlider'
import type { FeaturedPlayer } from '@/app/(public)/page'

interface Props {
  players: FeaturedPlayer[]
}

export async function LandingHero({ players }: Props) {
  const { t, lang } = await getServerT()

  // Split headline to highlight "Georgian Football" in green
  const title = t('landing.heroTitle')
  const highlightPhrase = lang === 'ka' ? 'ქართული ფეხბურთის' : 'Georgian Football'
  const parts = title.split(highlightPhrase)

  return (
    <section className="overflow-hidden">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 lg:py-24">
          {/* Left — content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <span aria-hidden="true">&#9733;</span>
              {t('landing.heroBadge')}
            </span>

            {/* Headline */}
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight leading-[1.1] sm:text-4xl lg:text-5xl">
              {parts.length > 1 ? (
                <>
                  {parts[0]}
                  <span className="text-primary">{highlightPhrase}</span>
                  {parts[1]}
                </>
              ) : (
                title
              )}
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base leading-relaxed text-foreground-secondary max-w-lg mx-auto lg:mx-0">
              {t('landing.heroSubtitle')}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-lg bg-primary text-btn-primary-text min-w-[160px] px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-hover"
              >
                {t('landing.heroGetStarted')} &rarr;
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-lg border-2 border-foreground-faint/40 min-w-[160px] px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
              >
                {t('landing.heroLearnMore')}
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6 max-w-md mx-auto lg:mx-0">
              <div>
                <div className="text-2xl font-extrabold sm:text-3xl">
                  {t('landing.statsYouthPlayers')}
                </div>
                <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-faint">
                  {t('landing.statsYouthPlayersLabel')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold sm:text-3xl">
                  {t('landing.statsTransfers')}
                </div>
                <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-faint">
                  {t('landing.statsTransfersLabel')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold sm:text-3xl">
                  {t('landing.statsVerified')}
                </div>
                <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-faint">
                  {t('landing.statsVerifiedLabel')}
                </div>
              </div>
            </div>
          </div>

          {/* Right — player slider */}
          <div className="flex items-center justify-center lg:justify-end">
            <HeroPlayerSlider players={players} />
          </div>
        </div>
      </div>
    </section>
  )
}
