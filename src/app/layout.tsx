import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Geist, Noto_Sans_Georgian } from 'next/font/google'
import { LanguageProvider } from '@/context/LanguageContext'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const notoGeorgian = Noto_Sans_Georgian({
  variable: '--font-noto-georgian',
  subsets: ['georgian'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Georgian Football Talent Platform',
  description:
    'Discover the next generation of Georgian football talent. A scouting platform connecting academies with international scouts and agents.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const rawLang = cookieStore.get('lang')?.value
  const lang = rawLang === 'ka' ? 'ka' : 'en'

  return (
    <html lang={lang}>
      <body
        className={`${geistSans.variable} ${notoGeorgian.variable} font-sans antialiased`}
      >
        <LanguageProvider initialLang={lang as 'en' | 'ka'}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
