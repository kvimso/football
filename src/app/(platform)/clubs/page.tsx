import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { ClubCard } from '@/components/club/ClubCard'

export const metadata: Metadata = {
  title: 'Clubs & Academies | Georgian Football Talent Platform',
  description: 'Explore Georgian football academies developing the next generation of talent.',
}

export default async function ClubsPage() {
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select(`
      id, name, name_ka, slug, logo_url, city, region, description, description_ka,
      players ( id )
    `)
    .order('name')

  if (clubsError) console.error('Failed to fetch clubs:', clubsError.message)

  const clubCards = (clubs ?? []).map((c) => ({
    ...c,
    player_count: Array.isArray(c.players) ? c.players.length : 0,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('clubs.title')}</h1>
        <p className="mt-1 text-foreground-muted">
          {t('clubs.subtitle')}
        </p>
      </div>

      {clubCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubCards.map((club) => (
            <ClubCard key={club.slug} club={club} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground-muted">{t('clubs.noClubs')}</p>
        </div>
      )}
    </div>
  )
}
