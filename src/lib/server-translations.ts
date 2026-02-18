import { cookies } from 'next/headers'
import { translations, getNestedValue, type Lang } from './translations'

/** Server-side translation function. Reads lang from cookie. Use only in server components. */
export async function getServerT() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value as Lang) ?? 'en'
  return {
    t: (key: string) => getNestedValue(translations[lang], key),
    lang,
  }
}
