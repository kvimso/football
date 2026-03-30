import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingHero } from '@/components/landing/LandingHero'
import { ClubLogoSlider } from '@/components/landing/ClubLogoSlider'
import { SuccessStories } from '@/components/landing/SuccessStories'
import { AudiencePanels } from '@/components/landing/AudiencePanels'
import { Partners } from '@/components/landing/Partners'
import { FadeInOnScroll } from '@/components/ui/FadeInOnScroll'

export interface FeaturedPlayer {
  id: string
  name: string
  name_ka: string
  position: string
  date_of_birth: string
  photo_url: string | null
  club: { name: string; name_ka: string } | null
}

export interface FeaturedClub {
  id: string
  name: string
  name_ka: string
  slug: string
  logo_url: string | null
}

export default async function Home() {
  const supabase = await createClient()

  // Auth check — redirect logged-in users to platform
  let isLoggedIn = false
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Auth check failed — show landing page
  }

  if (isLoggedIn) redirect('/players')

  // Fetch featured players for hero slider
  const { data: dbPlayers } = await supabase
    .from('players')
    .select('id, name, name_ka, position, date_of_birth, photo_url, club:clubs(name, name_ka)')
    .eq('is_featured', true)
    .limit(5)
    .order('name')

  // Use DB players if available (with photos), otherwise show static showcase players
  const hasDbPlayersWithPhotos =
    dbPlayers && dbPlayers.length >= 2 && dbPlayers.some((p) => p.photo_url)
  const players: FeaturedPlayer[] = hasDbPlayersWithPhotos
    ? (dbPlayers as FeaturedPlayer[])
    : [
        {
          id: 'b1b2c3d4-0001-4000-8000-000000000001',
          name: 'Giorgi Mikautadze',
          name_ka: 'გიორგი მიქაუტაძე',
          position: 'ST',
          date_of_birth: '2008-03-15',
          photo_url: '/images/landing/slider-1.png',
          club: { name: 'Dinamo Tbilisi Academy', name_ka: 'დინამო თბილისის აკადემია' },
        },
        {
          id: 'b1b2c3d4-0002-4000-8000-000000000002',
          name: 'Luka Zarandia',
          name_ka: 'ლუკა ზარანდია',
          position: 'MID',
          date_of_birth: '2007-07-22',
          photo_url: '/images/landing/slider-2.png',
          club: { name: 'Dinamo Tbilisi Academy', name_ka: 'დინამო თბილისის აკადემია' },
        },
        {
          id: 'b1b2c3d4-0005-4000-8000-000000000005',
          name: 'Tornike Basilashvili',
          name_ka: 'თორნიკე ბასილაშვილი',
          position: 'WNG',
          date_of_birth: '2007-05-10',
          photo_url: '/images/landing/slider-3.jpg',
          club: { name: 'Iberia 1999 Tbilisi Academy', name_ka: 'იბერია 1999 თბილისის აკადემია' },
        },
        {
          id: 'b1b2c3d4-0006-4000-8000-000000000006',
          name: 'Saba Kirtadze',
          name_ka: 'საბა კირთაძე',
          position: 'ATT',
          date_of_birth: '2008-09-14',
          photo_url: '/images/landing/slider-4.jpg',
          club: { name: 'Iberia 1999 Tbilisi Academy', name_ka: 'იბერია 1999 თბილისის აკადემია' },
        },
      ]

  // Fetch clubs for logo slider
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, name_ka, slug, logo_url')
    .order('name')

  return (
    <>
      <LandingHero players={players} />
      <FadeInOnScroll>
        <ClubLogoSlider clubs={(clubs as FeaturedClub[]) ?? []} />
      </FadeInOnScroll>
      <FadeInOnScroll delay={50}>
        <SuccessStories />
      </FadeInOnScroll>
      <FadeInOnScroll delay={100}>
        <AudiencePanels />
      </FadeInOnScroll>
      <FadeInOnScroll delay={150}>
        <Partners />
      </FadeInOnScroll>
    </>
  )
}
