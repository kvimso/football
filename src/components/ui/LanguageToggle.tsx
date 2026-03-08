'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'

export function LanguageToggle() {
  const { t, lang, setLang } = useLang()
  const router = useRouter()

  return (
    <button
      onClick={() => {
        const newLang = lang === 'en' ? 'ka' : 'en'
        setLang(newLang)
        router.refresh()
      }}
      aria-label={t('nav.switchLanguage')}
      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
    >
      {lang === 'en' ? 'EN' : 'KA'}
    </button>
  )
}
