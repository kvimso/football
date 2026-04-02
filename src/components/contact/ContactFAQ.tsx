import { getServerT } from '@/lib/server-translations'

const FAQ_ITEMS = [
  { titleKey: 'contact.faq0Title', descKey: 'contact.faq0Desc' },
  { titleKey: 'contact.faq1Title', descKey: 'contact.faq1Desc' },
  { titleKey: 'contact.faq2Title', descKey: 'contact.faq2Desc' },
  { titleKey: 'contact.faq3Title', descKey: 'contact.faq3Desc' },
] as const

export async function ContactFAQ() {
  const { t } = await getServerT()

  return (
    <section className="px-4 py-16 sm:py-24" style={{ contentVisibility: 'auto' }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:gap-12">
          {/* Left — Professional Demo highlight card */}
          <div className="rounded-lg border border-border bg-surface/40 p-8 sm:p-9">
            <h2 className="text-lg font-extrabold text-foreground">{t('contact.demoTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
              {t('contact.demoDesc')}
            </p>
            <a
              href="?subject=scouting#contact-form"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary transition-all hover:gap-3"
            >
              {t('contact.demoLink')}
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {/* Right — 2x2 info cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            {FAQ_ITEMS.map((item) => (
              <div key={item.titleKey}>
                <h3 className="text-[15px] font-bold text-foreground">{t(item.titleKey)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground-secondary">
                  {t(item.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
