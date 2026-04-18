import { Nav } from '@/components/landing/Nav'
import { Footer } from '@/components/landing/Footer'

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
