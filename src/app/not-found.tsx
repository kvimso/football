import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export default async function NotFound() {
  const { t } = await getServerT()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-bold text-accent/30">404</div>
      <h1 className="mt-4 text-2xl font-bold text-foreground">{t('notFound.title')}</h1>
      <p className="mt-2 text-foreground-muted">
        {t('notFound.message')}
      </p>
      <Link href="/" className="btn-primary mt-6">
        {t('notFound.goHome')}
      </Link>
    </div>
  )
}
