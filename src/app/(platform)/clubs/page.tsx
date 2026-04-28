import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ClubCard, type ClubCardData } from '@/components/club/ClubCard'

export const metadata: Metadata = {
  title: 'Clubs · Binocly',
  description:
    'Browse Georgian football academies and reach the people developing the next generation of European talent.',
}

export const revalidate = 60

export default async function ClubsPage() {
  const supabase = await createClient()

  const { data: clubs, error } = await supabase
    .from('clubs')
    .select(
      `
      id, slug, name, logo_url, hero_photo_url, city, region, description, tier,
      players(count)
    `
    )
    .order('tier', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch clubs:', error.message)
  }

  const clubCards: ClubCardData[] = (clubs ?? []).map((c) => {
    const playersField = c.players as unknown as { count: number }[] | null
    const playerCount =
      Array.isArray(playersField) && playersField.length > 0 ? playersField[0]!.count : 0
    return {
      slug: c.slug,
      name: c.name,
      logo_url: c.logo_url,
      hero_photo_url: c.hero_photo_url,
      city: c.city,
      region: c.region,
      description: c.description,
      tier: c.tier,
      player_count: playerCount,
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <header className="mb-10 max-w-3xl sm:mb-14">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-foreground-faint">
          Academies
        </p>
        <h1 className="font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-5xl">
          Where Georgian football talent is built.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
          37,600+ youth players are training in Georgia right now. These are the academies producing
          them — explore who they are, see their roster, and message the people who can sign them.
        </p>
      </header>

      {clubCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {clubCards.map((club) => (
            <ClubCard key={club.slug} club={club} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
          <p className="font-serif text-xl text-foreground">No clubs yet.</p>
          <p className="mt-2 max-w-sm text-sm text-foreground-secondary">
            Academies are being onboarded. Check back soon.
          </p>
        </div>
      )}
    </div>
  )
}
