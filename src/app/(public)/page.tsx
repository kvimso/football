import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingHero } from '@/components/landing/LandingHero'
import { MarketStats } from '@/components/landing/MarketStats'
import { WhatWeDo } from '@/components/landing/WhatWeDo'
import { Services } from '@/components/landing/Services'
import { ForScouts } from '@/components/landing/ForScouts'
import { ForAcademies } from '@/components/landing/ForAcademies'
import { Partners } from '@/components/landing/Partners'

export default async function Home() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Auth check failed — show landing page
  }

  if (isLoggedIn) redirect('/players')

  return (
    <>
      <LandingHero />
      <MarketStats />
      <WhatWeDo />
      <Services />
      <ForScouts />
      <ForAcademies />
      <Partners />
    </>
  )
}
