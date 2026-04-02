import { getServerT } from '@/lib/server-translations'

export async function ContactHero() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  return (
    <section className="px-4 pb-12 pt-12 sm:pb-16 sm:pt-[72px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center gap-2">
          <span className="inline-block h-[2px] w-5 bg-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {t('contact.label')}
          </span>
        </div>

        <h1
          className={`mt-5 text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem] ${isKa ? 'font-sans' : ''}`}
          style={{
            ...(!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : {}),
            letterSpacing: '-0.03em',
          }}
        >
          {t('contact.heading')}
        </h1>

        <p className="mt-5 max-w-[520px] text-base leading-[1.7] text-foreground-secondary sm:text-lg">
          {t('contact.heroSubtitle')}
        </p>
      </div>
    </section>
  )
}
