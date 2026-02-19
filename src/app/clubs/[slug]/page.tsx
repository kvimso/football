import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { PlayerCard } from '@/components/player/PlayerCard'
import { ClubDetailClient } from '@/components/club/ClubDetailClient'
import { trackPageView } from '@/lib/analytics'

export const revalidate = 60

interface ClubPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ClubPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: club, error } = await supabase
    .from('clubs')
    .select('name, city')
    .eq('slug', slug)
    .single()

  if (error || !club) return { title: 'Club Not Found' }

  return {
    title: `${club.name} | Georgian Football Talent Platform`,
    description: `View the squad and academy details for ${club.name}, ${club.city}.`,
  }
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: club, error } = await supabase
    .from('clubs')
    .select(`
      id, name, name_ka, slug, logo_url, city, region,
      description, description_ka, website
    `)
    .eq('slug', slug)
    .single()

  if (error || !club) notFound()

  trackPageView({ pageType: 'club', entityId: club.id, entitySlug: club.slug })

  // Fetch players for this club
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(`
      slug, name, name_ka, position, date_of_birth, height_cm,
      preferred_foot, is_featured, photo_url, status,
      club:clubs!players_club_id_fkey ( name, name_ka ),
      season_stats:player_season_stats ( season, goals, assists, matches_played )
    `)
    .eq('club_id', club.id)
    .eq('status', 'active')
    .order('position')
    .order('name')

  if (playersError) console.error('Failed to fetch club players:', playersError.message)

  const playerCards = (players ?? []).map((p) => {
    const statsArr = Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []
    return {
      ...p,
      club: Array.isArray(p.club) ? p.club[0] : p.club,
      season_stats: statsArr.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? ''))[0] ?? null,
      status: p.status ?? 'active',
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/clubs" className="mb-6 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors">
        &larr; {t('clubs.backToClubs')}
      </Link>

      {/* Club header */}
      <div className="mt-4 flex items-start gap-5">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-background-secondary border border-border text-3xl font-bold text-accent">
          {club.logo_url ? (
            <Image src={club.logo_url} alt={club.name} fill className="rounded-2xl object-cover" sizes="80px" />
          ) : (
            club.name.charAt(0)
          )}
        </div>
        <div>
          <ClubDetailClient club={{
            name: club.name,
            name_ka: club.name_ka,
            description: club.description,
            description_ka: club.description_ka,
          }} />
          <div className="mt-1 flex items-center gap-3 text-sm text-foreground-muted">
            <span>{club.city}{club.region && club.city !== club.region ? `, ${club.region}` : ''}</span>
            {club.website && (
              <>
                <span>&middot;</span>
                <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {t('clubs.website')}
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Squad */}
      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-bold text-foreground">{t('clubs.squad')}</h2>
        {playerCards.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {playerCards.map((player) => (
              <PlayerCard key={player.slug} player={player} />
            ))}
          </div>
        ) : (
          <p className="text-foreground-muted">{t('clubs.noActivePlayers')}</p>
        )}
      </div>
    </div>
  )
}
