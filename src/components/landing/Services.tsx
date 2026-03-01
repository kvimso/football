import { getServerT } from '@/lib/server-translations'
import { DatabaseIcon, CameraIcon, FilmIcon, MessageIcon, ShieldIcon } from '@/components/ui/Icons'

export async function Services() {
  const { t } = await getServerT()

  const services = [
    { icon: DatabaseIcon, title: t('landing.service1Title'), desc: t('landing.service1Desc') },
    { icon: CameraIcon, title: t('landing.service2Title'), desc: t('landing.service2Desc') },
    { icon: FilmIcon, title: t('landing.service3Title'), desc: t('landing.service3Desc') },
    { icon: MessageIcon, title: t('landing.service4Title'), desc: t('landing.service4Desc') },
    { icon: ShieldIcon, title: t('landing.service5Title'), desc: t('landing.service5Desc') },
  ]

  return (
    <section className="relative py-16 sm:py-20">
      <div className="pitch-pattern absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-block h-1 w-12 rounded-full bg-accent mb-4" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.servicesTitle')}
          </h2>
          <p className="mt-4 text-foreground-muted leading-relaxed">
            {t('landing.servicesSubtitle')}
          </p>
        </div>

        {/* 3+2 grid layout */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-xl border border-border bg-card p-6 border-t-[3px] border-t-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <service.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
