import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import { BLUR_DATA_URL } from '@/lib/constants'

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
