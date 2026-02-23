import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export async function LandingHero() {
  const { t } = await getServerT()

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t('landing.heroTitle')}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-foreground-muted sm:text-xl">
            {t('landing.heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="btn-primary px-8 py-3 text-base"
            >
              {t('landing.registerScout')}
            </Link>
            <Link
              href="/login"
              className="btn-secondary px-8 py-3 text-base"
            >
              {t('landing.registerAcademy')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
