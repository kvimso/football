import type { Metadata } from 'next'
import { AboutContent } from '@/components/about/AboutContent'

export const metadata: Metadata = {
  title: 'About | Georgian Football Talent Platform',
  description: 'Learn about the Georgian Football Talent Platform — connecting Georgian youth football with international scouts.',
}

export default function AboutPage() {
  return <AboutContent />
}
