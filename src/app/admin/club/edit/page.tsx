import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/auth'
import { ClubProfileForm, type ClubProfileInitial } from '@/components/admin/ClubProfileForm'

export const metadata: Metadata = {
  title: 'Edit club · Binocly',
}

export const dynamic = 'force-dynamic'

export default async function AdminClubEditPage() {
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) redirect('/login')

  const { data: club, error } = await supabase
    .from('clubs')
    .select('id, slug, name, city, region, logo_url, hero_photo_url, history_text, gallery_urls')
    .eq('id', clubId)
    .single<ClubProfileInitial>()

  if (error || !club) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="font-serif text-lg text-foreground">Club not found</p>
        <p className="mt-2 text-sm text-foreground-secondary">
          Your account isn&apos;t linked to a club yet. Reach out to the platform team.
        </p>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-faint">
          Club profile
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-foreground">
          Customize your club page
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground-secondary">
          Logo, hero photo, history, and gallery shown to scouts on your public page.
        </p>
      </header>

      <ClubProfileForm initialClub={club} />
    </div>
  )
}
