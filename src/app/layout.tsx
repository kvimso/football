import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter, Noto_Sans_Georgian } from 'next/font/google'
import { ThemeProvider, type Theme } from '@/context/ThemeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { AuthProvider } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const notoGeorgian = Noto_Sans_Georgian({
  variable: '--font-noto-georgian',
  subsets: ['georgian'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Georgian Football Talent Platform',
    template: '%s | Georgian Football Talent',
  },
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

  const rawTheme = cookieStore.get('theme')?.value
  const initialTheme: Theme = rawTheme === 'dark' ? 'dark' : 'light'
  const dataTheme = initialTheme === 'dark' ? 'dark' : undefined

  // Check auth server-side so AuthProvider hydrates with correct state (no flash)
  let initialUser: { id: string; email?: string } | null = null
  let initialRole: UserRole | null = null
  let initialIsApproved = false
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-'))
  if (hasAuthCookie) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        initialUser = { id: user.id, email: user.email ?? undefined }
        const { data } = await supabase
          .from('profiles')
          .select('role, is_approved')
          .eq('id', user.id)
          .single()
        initialRole = (data?.role as UserRole) ?? null
        initialIsApproved = data?.is_approved ?? false
      }
    } catch {
      // Auth check failed — hydrate as anonymous
    }
  }

  return (
    <html lang={lang} {...(dataTheme ? { 'data-theme': dataTheme } : {})} suppressHydrationWarning>
      <body className={`${inter.variable} ${notoGeorgian.variable} font-sans antialiased`}>
        <ThemeProvider initialTheme={initialTheme}>
          <LanguageProvider initialLang={lang as 'en' | 'ka'}>
            <AuthProvider
              initialUser={initialUser}
              initialRole={initialRole}
              initialIsApproved={initialIsApproved}
            >
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
