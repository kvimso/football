'use client'

import { useLang } from '@/hooks/useLang'

export default function LeaguesError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLang()

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl font-bold text-foreground">{t('common.somethingWentWrong')}</h2>
      <p className="mt-2 text-sm text-foreground-secondary">{t('common.errorDescription')}</p>
      <button onClick={reset} className="btn-primary mt-6 text-sm">
        {t('common.tryAgain')}
      </button>
    </div>
  )
}
