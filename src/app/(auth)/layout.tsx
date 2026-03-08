import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="landing flex min-h-dvh flex-col bg-background text-foreground">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
