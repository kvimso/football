import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import { BLUR_DATA_URL } from '@/lib/constants'

const FEATURES = [
  {
    key: 'hdFootage' as const,
    icon: (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="h-[18px] w-[18px] text-primary"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    key: 'aiStats' as const,
    icon: (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="h-[18px] w-[18px] text-primary"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    key: 'highlights' as const,
    icon: (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="h-[18px] w-[18px] text-primary"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: 'directChat' as const,
    icon: (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="h-[18px] w-[18px] text-primary"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
] as const

export async function LeagueHero() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left — content */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary">
              {t('leagues.hero.eyebrow')}
            </span>

            {/* Headline */}
            <h1
              className={`mt-4 text-3xl font-extrabold tracking-tight leading-[1.1] sm:text-4xl lg:text-[2.75rem] ${isKa ? 'font-sans' : ''}`}
              style={!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined}
            >
              {t('leagues.hero.title')}
              <span className="text-primary italic">{t('leagues.hero.titleAccent')}</span>
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground-secondary mx-auto lg:mx-0">
              {t('leagues.hero.description')}
            </p>

            {/* Feature icons grid */}
            <div className="mt-7 grid grid-cols-2 gap-3 text-left">
              {FEATURES.map(({ key, icon }) => (
                <div
                  key={key}
                  className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-surface p-3.5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10">
                    {icon}
                  </div>
                  <h4 className="text-[13px] font-bold">{t(`leagues.hero.features.${key}`)}</h4>
                  <p className="text-[11px] leading-relaxed text-foreground-faint">
                    {t(`leagues.hero.features.${key}Desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — hero photo */}
          <div className="relative mx-auto w-full max-w-lg lg:mx-0">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src="/images/leagues/collage-main.jpg"
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>

            {/* Floating Starlive badge */}
            <div className="absolute -bottom-3 right-4 z-20 rounded-lg bg-primary-hover px-3 py-2 shadow-lg sm:right-8">
              <div className="text-[0.7rem] font-bold text-white leading-tight">
                {t('leagues.hero.badgeMain')}
              </div>
              <div className="text-[0.6rem] font-medium text-white/75 leading-tight">
                {t('leagues.hero.badgeSub')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
