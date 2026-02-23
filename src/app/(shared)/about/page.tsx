import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AboutContent } from '@/components/about/AboutContent'

export const metadata: Metadata = {
  title: 'About | Georgian Football Talent Platform',
  description: 'Learn about the Georgian Football Talent Platform — connecting Georgian youth football with international scouts.',
}

export default async function AboutPage() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Auth check failed — show visitor version
  }

  return <AboutContent isLoggedIn={isLoggedIn} />
}
