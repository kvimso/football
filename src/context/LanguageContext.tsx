'use client'

import { createContext, useState, useCallback, type ReactNode } from 'react'
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

function setLangCookie(lang: Lang) {
  document.cookie = `lang=${lang};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax;Secure`
}

export function LanguageProvider({ children, initialLang = 'en' }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

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
