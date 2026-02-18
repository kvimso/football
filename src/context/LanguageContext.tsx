'use client'

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { translations, getNestedValue, type Lang } from '@/lib/translations'

export type { Lang }

export interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
})

function getLangFromCookie(): Lang {
  if (typeof document === 'undefined') return 'en'
  const match = document.cookie.match(/(?:^|; )lang=(en|ka)/)
  return (match?.[1] as Lang) ?? 'en'
}

function setLangCookie(lang: Lang) {
  document.cookie = `lang=${lang};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    setLangState(getLangFromCookie())
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    setLangCookie(newLang)
  }, [])

  const t = useCallback(
    (key: string) => getNestedValue(translations[lang], key),
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
