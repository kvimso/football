import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

interface Props {
  isLoggedIn: boolean
}

export async function AboutCTA({ isLoggedIn }: Props) {
  const { t } = await getServerT()

  const primaryHref = isLoggedIn ? '/leagues' : '/register'
  const primaryLabel = isLoggedIn ? t('about.ctaPrimaryAuth') : t('about.ctaPrimary')

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="card-dark relative overflow-hidden rounded-[20px] px-8 py-12 sm:px-12 sm:py-16">
          {/* Decorative green circle */}
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="text-xl font-black sm:text-2xl" style={{ color: '#EEECE8' }}>
                {t('about.ctaHeading')}
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'rgba(238,236,232,0.6)' }}>
                {t('about.ctaSubtitle')}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-[10px] bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                {primaryLabel}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-[10px] border border-white/10 px-6 py-3 text-sm font-bold transition-colors hover:border-white/20"
                style={{ color: '#EEECE8' }}
              >
                {t('about.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
