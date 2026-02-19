import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export async function AboutContent() {
  const { t } = await getServerT()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">{t('about.title')}</h1>
      <p className="mt-2 text-foreground-muted">{t('about.subtitle')}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">{t('about.mission')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          {t('about.missionText')}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-foreground">{t('about.what')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          {t('about.whatText')}
        </p>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold text-accent">{t('about.forScouts')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            {t('about.forScoutsText')}
          </p>
          <Link href="/register" className="btn-primary mt-4 inline-block text-sm">
            {t('nav.register')}
          </Link>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-accent">{t('about.forAcademies')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            {t('about.forAcademiesText')}
          </p>
          <Link href="/login" className="btn-secondary mt-4 inline-block text-sm">
            {t('nav.login')}
          </Link>
        </div>
      </div>
    </div>
  )
}
