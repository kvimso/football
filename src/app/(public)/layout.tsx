import { Noto_Serif } from 'next/font/google'

const notoSerif = Noto_Serif({
  variable: '--font-noto-serif',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="light"
      className={`${notoSerif.variable} min-h-screen bg-background text-foreground`}
    >
      {children}
    </div>
  )
}
