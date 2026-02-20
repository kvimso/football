import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
// Force rebuild for Vercel env vars

export async function HomeHero() {
  const { t } = await getServerT()

  return (
    <section className="relative overflow-hidden border-b border-border bg-background-secondary">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 text-lg text-foreground-muted">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/players" className="btn-primary">
              {t('home.browsePlayers')}
            </Link>
            <Link href="/about" className="btn-secondary">
              {t('home.learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
