import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import { BLUR_DATA_URL } from '@/lib/constants'

export async function AboutHero() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  // Check if hero image exists — fall back to placeholder
  const heroSrc = '/images/about/hero.jpg'

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
          {/* Left — editorial text */}
          <div className="text-center lg:text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary">
              {t('about.label')}
            </span>

            <h1
              className={`mt-5 text-3xl font-black leading-[1.15] tracking-tight sm:text-4xl lg:text-[3.5rem] ${isKa ? 'font-sans' : ''}`}
              style={{
                ...(!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : {}),
                letterSpacing: '-0.03em',
              }}
            >
              {t('about.heroTitle')}
              <span className="italic text-primary">{t('about.heroTitleAccent')}</span>
              {t('about.heroTitleEnd')}
            </h1>

            <p className="mx-auto mt-6 max-w-[560px] text-base leading-[1.7] text-foreground-secondary sm:text-lg lg:mx-0">
              {t('about.heroDescription')}
            </p>
          </div>

          {/* Right — portrait image */}
          <div className="relative mx-auto hidden w-full max-w-[380px] lg:mx-0 lg:block">
            <div
              className="relative aspect-[3/4] overflow-hidden rounded-2xl"
              style={{
                boxShadow: '0 16px 48px -8px rgba(26,25,23,0.1)',
              }}
            >
              <Image
                src={heroSrc}
                alt={t('about.heroImageAlt')}
                fill
                priority
                className="object-cover"
                style={{ filter: 'grayscale(15%) contrast(108%)' }}
                sizes="(max-width: 768px) 100vw, 380px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
