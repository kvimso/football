import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Defense-in-depth role guard (middleware handles role routing normally)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role && profile.role !== 'scout') notFound()

  return (
    <>
      <Navbar />
      <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8">
        <DashboardNav />
        <div className="mt-6">{children}</div>
      </div>
      <Footer />
    </>
  )
}
