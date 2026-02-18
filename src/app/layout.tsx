import type { Metadata } from 'next'
import { Geist, Noto_Sans_Georgian } from 'next/font/google'
import { LanguageProvider } from '@/context/LanguageContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${notoGeorgian.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
