import { getServerT } from '@/lib/server-translations'

export async function HowItWorks() {
  const { t } = await getServerT()

  const steps = [
    { title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { title: t('landing.step3Title'), desc: t('landing.step3Desc') },
  ]

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('landing.howItWorksTitle')}
          </h2>
          <p className="mt-3 text-foreground-secondary">{t('landing.howItWorksSubtitle')}</p>
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden sm:block">
          <div className="relative flex items-start justify-between max-w-2xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-5 left-[calc(16.67%)] right-[calc(16.67%)] h-px bg-border" />

            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center w-1/3"
              >
                {/* Numbered circle */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-btn-primary-text">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-foreground-secondary max-w-[200px]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="sm:hidden">
          <div className="relative pl-10">
            {/* Vertical connecting line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

            {steps.map((step, i) => (
              <div key={step.title} className={`relative flex gap-4 ${i > 0 ? 'mt-8' : ''}`}>
                {/* Numbered circle */}
                <div className="absolute left-[-21px] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-btn-primary-text">
                  {i + 1}
                </div>
                <div className="pt-1.5">
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-foreground-secondary">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
