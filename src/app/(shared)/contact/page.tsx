import type { Metadata } from 'next'
import { ContactHero } from '@/components/contact/ContactHero'
import { ContactSplit } from '@/components/contact/ContactSplit'
import { ContactHelp } from '@/components/contact/ContactHelp'
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
      {/* Gradient divider */}
      <FadeInOnScroll>
        <div className="mx-auto max-w-[1200px] px-6">
          <div
            className="h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent)',
            }}
          />
        </div>
      </FadeInOnScroll>
      <FadeInOnScroll delay={50}>
        <ContactHelp />
      </FadeInOnScroll>
    </>
  )
}
