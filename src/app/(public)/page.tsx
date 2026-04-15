import { Nav } from '@/components/landing/Nav'
import { Hero } from '@/components/landing/Hero'
import { MarketPulse } from '@/components/landing/MarketPulse'
import { SuccessStories } from '@/components/landing/SuccessStories'
import { Manifesto } from '@/components/landing/Manifesto'
import { WhatWeOffer } from '@/components/landing/WhatWeOffer'
import { Footer } from '@/components/landing/Footer'
import type { SliderPlayer } from '@/components/landing/PlayerSlider'

// Curated hero slider — swap for DB-driven featured players once Phase 7 lands.
const DEMO_SLIDER_PLAYERS: SliderPlayer[] = [
  {
    id: 'demo-1',
    name: 'Amiran Tkeshelashvili',
    position: 'MID',
    date_of_birth: '2007-03-15',
    photo_url: '/images/landing/slider-1.jpg',
    club: { name: 'Torpedo Kutaisi' },
  },
  {
    id: 'demo-2',
    name: 'Dimitri Maisuradze',
    position: 'DEF',
    date_of_birth: '2006-08-22',
    photo_url: '/images/landing/slider-2.jpg',
    club: { name: 'Torpedo Kutaisi' },
  },
  {
    id: 'demo-3',
    name: 'Aleko Basiladze',
    position: 'ATT',
    date_of_birth: '2007-01-10',
    photo_url: '/images/landing/slider-3.jpg',
    club: { name: 'Torpedo Kutaisi' },
  },
  {
    id: 'demo-4',
    name: 'Giorgi Cereteli',
    position: 'MID',
    date_of_birth: '2005-11-05',
    photo_url: '/images/landing/slider-4.jpg',
    club: { name: 'Locomotive Tbilisi' },
  },
]

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero players={DEMO_SLIDER_PLAYERS} />
        <MarketPulse />
        <SuccessStories />
        <Manifesto />
        <WhatWeOffer />
      </main>
      <Footer />
    </>
  )
}
