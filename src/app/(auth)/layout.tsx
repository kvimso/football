import { LandingNav } from '@/components/landing/LandingNav'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="landing min-h-screen bg-background text-foreground">
      <LandingNav />
      <main>{children}</main>
    </div>
  )
}
