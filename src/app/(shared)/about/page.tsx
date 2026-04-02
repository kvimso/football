import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AboutHero } from '@/components/about/AboutHero'
import { AboutStats } from '@/components/about/AboutStats'
import { AboutBento } from '@/components/about/AboutBento'
import { AboutFeatures } from '@/components/about/AboutFeatures'
import { AboutPrinciples } from '@/components/about/AboutPrinciples'
import { AboutCTA } from '@/components/about/AboutCTA'
import { FadeInOnScroll } from '@/components/ui/FadeInOnScroll'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'About',
  description:
    'Binocly is the scouting platform Georgian football has been missing. Verified camera stats, direct messaging, and a centralized player directory.',
  openGraph: {
    title: 'About Binocly',
    description: 'The scouting platform Georgian football has been missing.',
    images: [{ url: '/images/about/hero.jpg', width: 570, height: 760 }],
  },
}

export default async function AboutPage() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Auth check failed — show visitor version
  }

  return (
    <>
      <AboutHero />
      <FadeInOnScroll>
        <AboutStats />
      </FadeInOnScroll>
      <FadeInOnScroll delay={50}>
        <AboutBento />
      </FadeInOnScroll>
      <FadeInOnScroll delay={100}>
        <AboutFeatures />
      </FadeInOnScroll>
      <FadeInOnScroll delay={150}>
        <AboutPrinciples />
      </FadeInOnScroll>
      <FadeInOnScroll delay={200}>
        <AboutCTA isLoggedIn={isLoggedIn} />
      </FadeInOnScroll>
    </>
  )
}
