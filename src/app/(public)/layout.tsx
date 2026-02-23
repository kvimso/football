import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </div>
  )
}
