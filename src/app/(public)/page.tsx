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
  const { data: players } = await supabase
    .from('players')
    .select('id, name, name_ka, position, date_of_birth, photo_url, club:clubs(name, name_ka)')
    .eq('is_featured', true)
    .limit(5)
    .order('name')

  // Fetch clubs for logo slider
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, name_ka, slug, logo_url')
    .order('name')

  return (
    <>
      <LandingHero players={(players as FeaturedPlayer[]) ?? []} />
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
