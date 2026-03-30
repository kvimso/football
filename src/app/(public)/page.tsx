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
          id: 'static-1',
          name: 'Amiran Tkeshelashvili',
          name_ka: 'ამირან ტყეშელაშვილი',
          position: 'MID',
          date_of_birth: '2007-03-15',
          photo_url: '/images/landing/slider-1.png',
          club: { name: 'Torpedo Kutaisi', name_ka: 'ტორპედო ქუთაისი' },
        },
        {
          id: 'static-2',
          name: 'Dimitri Maisuradze',
          name_ka: 'დიმიტრი მაისურაძე',
          position: 'DEF',
          date_of_birth: '2006-07-22',
          photo_url: '/images/landing/slider-2.png',
          club: { name: 'Torpedo Kutaisi', name_ka: 'ტორპედო ქუთაისი' },
        },
        {
          id: 'static-3',
          name: 'Luka Gozalishvili',
          name_ka: 'ლუკა გოზალიშვილი',
          position: 'MID',
          date_of_birth: '2005-09-12',
          photo_url: '/images/landing/slider-3.jpg',
          club: { name: 'Locomotive Tbilisi', name_ka: 'ლოკომოტივი თბილისი' },
        },
        {
          id: 'static-4',
          name: 'Giorgi Cereteli',
          name_ka: 'გიორგი ცერეთელი',
          position: 'MID',
          date_of_birth: '2005-11-05',
          photo_url: '/images/landing/slider-4.jpg',
          club: { name: 'Locomotive Tbilisi', name_ka: 'ლოკომოტივი თბილისი' },
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
