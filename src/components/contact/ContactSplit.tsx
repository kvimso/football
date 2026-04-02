import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from './ContactForm'
import { BLUR_DATA_URL } from '@/lib/constants'

export async function ContactSplit({ defaultSubject }: { defaultSubject?: string }) {
  const { t } = await getServerT()

  // Auth check for email pre-fill
  let userEmail: string | undefined
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userEmail = user?.email ?? undefined
  } catch {
    // Auth check failed — show default form
  }

  return (
    <section className="px-4 pb-16 sm:pb-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[5fr_7fr] lg:gap-8">
          {/* Left — Stadium image with overlaid contact info */}
          <div className="relative min-h-[300px] overflow-hidden rounded-xl lg:min-h-[500px]">
            <Image
              src="/images/contact/hero.jpg"
              alt={t('contact.heroImageAlt')}
              fill
              priority
              className="object-cover"
              style={{ filter: 'grayscale(20%) sepia(8%) brightness(88%)' }}
              sizes="(max-width: 900px) 100vw, 42vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
            {/* Green tint overlay */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(27,138,74,0.05)', mixBlendMode: 'multiply' }}
            />
            {/* Dark gradient for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(10,10,8,0.85) 0%, rgba(10,10,8,0.3) 40%, transparent 70%)',
              }}
            />
            {/* Contact info overlaid at bottom — hardcoded light text since it's always over a dark gradient */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-6 sm:p-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ADE80]">
                  {t('contact.officeLabel')}
                </div>
                <div
                  className="mt-1.5 text-sm leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  {t('contact.officeAddress1')}
                </div>
                <div
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  {t('contact.officeAddress2')}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ADE80]">
                  {t('contact.emailLabel')}
                </div>
                <a
                  href="mailto:hello@binocly.ge"
                  className="mt-1.5 inline-block text-sm underline underline-offset-4 transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  {t('contact.emailAddress')}
                </a>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ADE80]">
                  {t('contact.responseLabel')}
                </div>
                <div className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {t('contact.responseValue')}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Dark form card */}
          <div
            className="relative overflow-hidden p-7 sm:p-10"
            style={{
              background: 'linear-gradient(155deg, #1A1917 0%, #12110F 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
            }}
          >
            {/* Green glow orb — decorative */}
            <div
              className="pointer-events-none absolute"
              style={{
                top: '-80px',
                right: '-80px',
                width: '250px',
                height: '250px',
                background: 'radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />
            <div className="relative">
              <ContactForm defaultEmail={userEmail} defaultSubject={defaultSubject} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
