import type { Metadata } from 'next'
import { ContactHero } from '@/components/contact/ContactHero'
import { ContactSplit } from '@/components/contact/ContactSplit'
import { ContactPartners } from '@/components/contact/ContactPartners'
import { ContactFAQ } from '@/components/contact/ContactFAQ'
import { FadeInOnScroll } from '@/components/ui/FadeInOnScroll'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Binocly. Questions about scouting, academy partnerships, or camera technology? We respond within 24 hours.',
  openGraph: {
    title: 'Contact Binocly',
    description: 'Questions about scouting, academy partnerships, or camera technology?',
  },
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>
}) {
  const params = await searchParams
  const defaultSubject = params.subject

  return (
    <>
      <ContactHero />
      <ContactSplit defaultSubject={defaultSubject} />
      <FadeInOnScroll>
        <ContactPartners />
      </FadeInOnScroll>
      <FadeInOnScroll delay={50}>
        <ContactFAQ />
      </FadeInOnScroll>
    </>
  )
}
