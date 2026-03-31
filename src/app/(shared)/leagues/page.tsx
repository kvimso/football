import type { Metadata } from 'next'
import { Noto_Serif } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { LeagueHero } from '@/components/league/LeagueHero'
import { LeagueShowcase } from '@/components/league/LeagueShowcase'
import { HowItWorks } from '@/components/league/HowItWorks'
import { SeasonCalendar } from '@/components/league/SeasonCalendar'
import { LeagueCTA } from '@/components/league/LeagueCTA'
import { FadeInOnScroll } from '@/components/ui/FadeInOnScroll'

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-noto-serif',
})

export const revalidate = 300 // 5 minutes ISR — leagues change infrequently

export const metadata: Metadata = {
  title: 'Leagues',
  description: 'Discover Georgian youth football leagues tracked by Pixellot cameras.',
  openGraph: {
    title: 'Georgian Youth Leagues | Binocly',
    description: 'Browse U15, U17, and U19 leagues with verified camera statistics.',
  },
}

export default async function LeaguesPage() {
  const supabase = await createClient()

  // Auth check — needed for CTA personalization
  let isLoggedIn = false
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Auth check failed — treat as anonymous
  }

  // Single query — all sections derive from this data
  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  const activeLeagues = leagues ?? []

  return (
    <div className={notoSerif.variable}>
      <FadeInOnScroll>
        <LeagueHero />
      </FadeInOnScroll>

      <FadeInOnScroll delay={50}>
        <LeagueShowcase leagues={activeLeagues} />
      </FadeInOnScroll>

      <FadeInOnScroll delay={100}>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}>
          <HowItWorks />
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll delay={150}>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 400px' }}>
          <SeasonCalendar leagues={activeLeagues} />
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll delay={200}>
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px' }}>
          <LeagueCTA isLoggedIn={isLoggedIn} />
        </div>
      </FadeInOnScroll>
    </div>
  )
}
