import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { unwrapRelation } from '@/lib/utils'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Defense-in-depth: middleware handles role routing, but guard here too
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, club_id, full_name, club:clubs!profiles_club_id_fkey(name, name_ka)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'academy_admin') notFound()

  const club = unwrapRelation(profile.club)

  return (
    <>
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col px-4 pt-8">
        <div className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row">
          <AdminSidebar clubName={club?.name ?? ''} clubNameKa={club?.name_ka ?? ''} />
          <main className="min-h-0 min-w-0 flex-1">{children}</main>
        </div>
      </div>
      <Footer />
    </>
  )
}
