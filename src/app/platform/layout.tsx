import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PlatformSidebar } from '@/components/platform/PlatformSidebar'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile || profile.role !== 'platform_admin') notFound()

  return (
    <>
      <Navbar />
      <div className="mx-auto min-h-[calc(100dvh-var(--navbar-height))] max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <PlatformSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <Footer />
    </>
  )
}
