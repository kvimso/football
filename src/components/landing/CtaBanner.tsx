import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export async function CtaBanner() {
  const { t } = await getServerT()

  return (
    <section
      style={{
        background: '#12110F',
        color: '#EEECE8',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('landing.ctaTitle')}
        </h2>
        <p className="mt-4 text-sm" style={{ color: '#9A9590' }}>
          {t('landing.ctaSubtitle')}
        </p>
        <div className="mt-8">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#4ADE80', color: '#12110F' }}
          >
            {t('landing.ctaCta')} &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
