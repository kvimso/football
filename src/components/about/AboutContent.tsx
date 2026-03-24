import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export async function AboutContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = await getServerT()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{t('about.title')}</h1>
      <p className="mt-2 text-foreground-secondary">{t('about.subtitle')}</p>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">{t('about.mission')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
          {t('about.missionText')}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-foreground">{t('about.what')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
          {t('about.whatText')}
        </p>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold text-primary">{t('about.forScouts')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            {t('about.forScoutsText')}
          </p>
          {isLoggedIn ? (
            <Link href="/leagues" className="btn-primary mt-4 inline-block text-sm">
              {t('nav.exploreLeagues')}
            </Link>
          ) : (
            <Link href="/demo" className="btn-primary mt-4 inline-block text-sm">
              {t('nav.requestDemo')}
            </Link>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-primary">{t('about.forAcademies')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            {t('about.forAcademiesText')}
          </p>
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn-secondary mt-4 inline-block text-sm">
              {t('nav.dashboard')}
            </Link>
          ) : (
            <Link href="/login" className="btn-secondary mt-4 inline-block text-sm">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
