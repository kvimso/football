import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingHero } from '@/components/landing/LandingHero'
import { SocialProof } from '@/components/landing/SocialProof'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { AudiencePanels } from '@/components/landing/AudiencePanels'
import { Partners } from '@/components/landing/Partners'
import { CtaBanner } from '@/components/landing/CtaBanner'
import { FadeInOnScroll } from '@/components/ui/FadeInOnScroll'

export default async function Home() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Auth check failed — show landing page
  }

  if (isLoggedIn) redirect('/players')

  return (
    <>
      <LandingHero />
      <SocialProof />
      <FadeInOnScroll>
        <HowItWorks />
      </FadeInOnScroll>
      <FadeInOnScroll delay={50}>
        <AudiencePanels />
      </FadeInOnScroll>
      <FadeInOnScroll delay={100}>
        <Partners />
      </FadeInOnScroll>
      <FadeInOnScroll delay={150}>
        <CtaBanner />
      </FadeInOnScroll>
    </>
  )
}
