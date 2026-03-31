import { getServerT } from '@/lib/server-translations'

const STEPS = [
  { num: '01', titleKey: 'leagues.howItWorks.step1Title', descKey: 'leagues.howItWorks.step1Desc' },
  { num: '02', titleKey: 'leagues.howItWorks.step2Title', descKey: 'leagues.howItWorks.step2Desc' },
  { num: '03', titleKey: 'leagues.howItWorks.step3Title', descKey: 'leagues.howItWorks.step3Desc' },
]

export async function HowItWorks() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  return (
    <section className="bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section heading */}
        <div className="text-center mb-12">
          <h2
            className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${isKa ? 'font-sans' : ''}`}
            style={!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined}
          >
            {t('leagues.howItWorks.title')}
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-12 rounded-full bg-primary" />
        </div>

        {/* Steps row */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative text-center">
              {/* Oversized serif numeral — editorial accent */}
              <div
                className="mx-auto mb-3 text-[4rem] font-extrabold leading-none text-primary/20 select-none"
                aria-hidden="true"
                style={
                  !isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined
                }
              >
                {step.num}
              </div>

              {/* Connecting line between steps (desktop only) */}
              {i < STEPS.length - 1 && (
                <div className="absolute top-8 left-[calc(50%+2rem)] right-0 hidden h-px bg-border sm:block" />
              )}

              <h3 className="text-base font-bold text-foreground">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary max-w-xs mx-auto">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
