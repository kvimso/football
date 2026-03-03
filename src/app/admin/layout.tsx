import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { unwrapRelation } from '@/lib/utils'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, club_id, full_name, club:clubs!profiles_club_id_fkey(name, name_ka)')
    .eq('id', user.id)
    .single()

  // Defense-in-depth role guard (middleware handles role routing normally)
  if (!profile || !['academy_admin', 'platform_admin'].includes(profile.role)) {
    notFound()
  }

  const club = unwrapRelation(profile.club)

  return (
    <>
      <Navbar />
      <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <AdminSidebar
            clubName={club?.name ?? ''}
            clubNameKa={club?.name_ka ?? ''}
          />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <Footer />
    </>
  )
}
