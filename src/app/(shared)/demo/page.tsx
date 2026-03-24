import type { Metadata } from 'next'
import { getServerT } from '@/lib/server-translations'

export const metadata: Metadata = {
  title: 'Request Demo',
}

export default async function DemoPage() {
  const { t } = await getServerT()

  return (
    <div className="mx-auto max-w-7xl px-4 py-20">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('demo.title')}</h1>
        <p className="mt-4 text-sm text-foreground-muted leading-relaxed">{t('demo.comingSoon')}</p>
        <a
          href="mailto:info@gft.ge"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          info@gft.ge
        </a>
      </div>
    </div>
  )
}
