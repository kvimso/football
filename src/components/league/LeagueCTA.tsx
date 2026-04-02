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
    <section className="pb-12 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto flex flex-col items-center gap-6 rounded-2xl border border-white/[0.06] bg-surface px-8 py-6 sm:flex-row sm:justify-between sm:gap-8 sm:px-9 sm:py-7">
          <div>
            <h2 className="text-lg font-extrabold sm:text-xl">{t('leagues.cta.title')}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground-faint">
              {t('leagues.cta.subtitle')}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            {label} &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
