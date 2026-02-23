import { LandingNav } from '@/components/landing/LandingNav'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>{children}</main>
    </div>
  )
}
