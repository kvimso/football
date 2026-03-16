import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Defense-in-depth: middleware handles role routing, but guard here too
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'scout') notFound()

  return (
    <>
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100dvh-var(--navbar-height))] max-w-7xl flex-col px-4 pt-8">
        <DashboardNav />
        <div className="mt-6 min-h-0 flex-1">{children}</div>
      </div>
      <Footer />
    </>
  )
}
