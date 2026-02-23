import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Geist, Noto_Sans_Georgian } from 'next/font/google'
import { LanguageProvider } from '@/context/LanguageContext'
import { AuthProvider } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/server'
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

  // Check auth server-side so AuthProvider hydrates with correct state (no flash)
  let initialUser: { id: string; email?: string } | null = null
  let initialRole: string | null = null
  const hasAuthCookie = cookieStore.getAll().some(c => c.name.startsWith('sb-'))
  if (hasAuthCookie) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        initialUser = { id: user.id, email: user.email ?? undefined }
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        initialRole = data?.role ?? null
      }
    } catch {
      // Auth check failed — hydrate as anonymous
    }
  }

  return (
    <html lang={lang}>
      <body
        className={`${geistSans.variable} ${notoGeorgian.variable} font-sans antialiased`}
      >
        <LanguageProvider initialLang={lang as 'en' | 'ka'}>
          <AuthProvider initialUser={initialUser} initialRole={initialRole}>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
