import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
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

  const showSlider = players.length >= 2
  const showStaticCard = players.length === 0

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
              <Link href="/demo" className="btn-primary px-7 py-3 text-sm font-semibold">
                {t('landing.heroGetStarted')} &rarr;
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-lg border-2 border-foreground-faint/40 px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
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
                <div className="flex items-center gap-1 text-2xl font-extrabold sm:text-3xl">
                  <span className="text-primary">&#10003;</span>
                  <span>{lang === 'ka' ? 'დამოწმებული' : 'Verified'}</span>
                </div>
                <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-faint">
                  {t('landing.statsVerifiedLabel')}
                </div>
              </div>
            </div>
          </div>

          {/* Right — player slider or static mock card */}
          <div className="flex items-center justify-center lg:justify-end">
            {showSlider ? (
              <HeroPlayerSlider players={players} />
            ) : showStaticCard ? (
              <MockPlayerCard t={t} />
            ) : (
              // Single featured player — show static (no rotation)
              <HeroPlayerSlider players={players} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Fallback mock card when no featured players exist in DB */
function MockPlayerCard({ t }: { t: (key: string) => string }) {
  return (
    <div
      className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden mx-auto lg:mx-0"
      aria-hidden="true"
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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1C1A17] to-[#2A2623]" />

      {/* Card content */}
      <div className="relative flex flex-col items-center justify-center h-full p-6">
        <div className="rounded-full bg-[var(--surface)] p-4">
          <PlayerSilhouette size="md" className="text-[var(--foreground-muted)]/40" />
        </div>

        <div className="mt-4 text-center">
          <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
            {t('landing.mockPlayerName')}
          </div>
          <div className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {t('landing.mockPosition')} · {t('landing.mockAge')}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
            {t('landing.mockClub')}
          </div>
        </div>

        <div
          className="mt-5 grid grid-cols-3 gap-3 rounded-lg p-3 w-full"
          style={{ background: 'rgba(18,17,15,0.6)' }}
        >
          {[
            { val: '12', label: t('landing.mockGoals') },
            { val: '8', label: t('landing.mockAssists') },
            { val: '24', label: t('landing.mockMatches') },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                {s.val}
              </div>
              <div
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-4 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--foreground-muted)' }}
        >
          <svg className="h-3 w-3" fill="var(--primary)" viewBox="0 0 20 20">
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
  )
}
