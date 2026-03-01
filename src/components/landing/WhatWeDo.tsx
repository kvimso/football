import { getServerT } from '@/lib/server-translations'
import { DatabaseIcon, CameraIcon, MessageIcon } from '@/components/ui/Icons'

export async function WhatWeDo() {
  const { t } = await getServerT()

  const features = [
    { icon: DatabaseIcon, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { icon: CameraIcon, title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { icon: MessageIcon, title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
  ]

  return (
    <section className="py-16 sm:py-20 bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-block h-1 w-12 rounded-full bg-accent mb-4" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.whatWeDoTitle')}
          </h2>
          <p className="mt-4 text-foreground-muted leading-relaxed">
            {t('landing.whatWeDoSubtitle')}
          </p>
        </div>

        {/* 3-column feature grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
