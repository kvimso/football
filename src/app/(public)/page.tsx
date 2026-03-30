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

// Static demo players for hero slider (used when no DB players are featured)
const DEMO_SLIDER_PLAYERS: FeaturedPlayer[] = [
  {
    id: 'demo-1',
    name: 'Amiran Tkeshelashvili',
    name_ka: 'ამირან ტყეშელაშვილი',
    position: 'MID',
    date_of_birth: '2007-03-15',
    photo_url: '/images/landing/slider-1.png',
    club: { name: 'Torpedo Kutaisi', name_ka: 'ტორპედო ქუთაისი' },
  },
  {
    id: 'demo-2',
    name: 'Dimitri Maisuradze',
    name_ka: 'დიმიტრი მაისურაძე',
    position: 'DEF',
    date_of_birth: '2006-08-22',
    photo_url: '/images/landing/slider-2.png',
    club: { name: 'Torpedo Kutaisi', name_ka: 'ტორპედო ქუთაისი' },
  },
  {
    id: 'demo-3',
    name: 'Aleko Basiladze',
    name_ka: 'ალეკო ბასილაძე',
    position: 'ATT',
    date_of_birth: '2007-01-10',
    photo_url: '/images/landing/slider-3.jpg',
    club: { name: 'Torpedo Kutaisi', name_ka: 'ტორპედო ქუთაისი' },
  },
  {
    id: 'demo-4',
    name: 'Giorgi Cereteli',
    name_ka: 'გიორგი ცერეთელი',
    position: 'MID',
    date_of_birth: '2005-11-05',
    photo_url: '/images/landing/slider-4.jpg',
    club: { name: 'Locomotive Tbilisi', name_ka: 'ლოკომოტივი თბილისი' },
  },
]

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

  // Fetch clubs for logo slider
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, name_ka, slug, logo_url')
    .order('name')

  return (
    <>
      <LandingHero players={DEMO_SLIDER_PLAYERS} />
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
