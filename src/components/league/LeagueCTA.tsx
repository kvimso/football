import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

interface Props {
  isLoggedIn: boolean
}

export async function LeagueCTA({ isLoggedIn }: Props) {
  const { t } = await getServerT()

  const href = isLoggedIn ? '/players' : '/demo'
  const label = isLoggedIn ? t('leagues.cta.buttonAuth') : t('leagues.cta.button')

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-2xl bg-primary-hover px-6 py-14 text-center sm:px-12 sm:py-20">
          {/* Dot-grid texture overlay */}
          <div className="dot-texture absolute inset-0 pointer-events-none" aria-hidden="true" />

          {/* Content — above texture */}
          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              {t('leagues.cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/80">
              {t('leagues.cta.subtitle')}
            </p>
            <Link
              href={href}
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-hover transition-colors hover:bg-white/90"
            >
              {label} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
