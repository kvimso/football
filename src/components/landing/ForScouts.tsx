import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
import { CheckCircleIcon } from '@/components/ui/Icons'

export async function ForScouts() {
  const { t } = await getServerT()

  const benefits = [
    t('landing.scoutBenefit1'),
    t('landing.scoutBenefit2'),
    t('landing.scoutBenefit3'),
    t('landing.scoutBenefit4'),
    t('landing.scoutBenefit5'),
  ]

  return (
    <section className="py-16 sm:py-20 bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — content */}
          <div>
            <div className="inline-block h-1 w-12 rounded-full bg-accent mb-4" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.forScoutsTitle')}
            </h2>
            <p className="mt-4 text-foreground-muted leading-relaxed">
              {t('landing.forScoutsSubtitle')}
            </p>

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                  <span className="text-sm leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/register" className="btn-primary px-8 py-3 text-base font-semibold">
                {t('landing.scoutCta')}
              </Link>
            </div>
          </div>

          {/* Right — decorative pitch diagram */}
          <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
            <div className="relative h-72 w-full max-w-sm">
              {/* Pitch outline */}
              <div className="absolute inset-0 rounded-xl border-2 border-accent/10" />
              {/* Halfway line */}
              <div className="absolute top-0 left-1/2 h-full w-px bg-accent/[0.08]" />
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full border border-accent/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-accent/20" />
              {/* Left penalty box */}
              <div className="absolute top-1/4 left-0 h-1/2 w-16 border-r border-y border-accent/[0.08] rounded-r-sm" />
              {/* Right penalty box */}
              <div className="absolute top-1/4 right-0 h-1/2 w-16 border-l border-y border-accent/[0.08] rounded-l-sm" />
              {/* Player dots */}
              <div className="absolute top-[30%] left-[20%] h-2.5 w-2.5 rounded-full bg-accent/25" />
              <div className="absolute top-[60%] left-[25%] h-2.5 w-2.5 rounded-full bg-accent/25" />
              <div className="absolute top-[45%] left-[45%] h-2.5 w-2.5 rounded-full bg-accent/25" />
              <div className="absolute top-[35%] left-[65%] h-2.5 w-2.5 rounded-full bg-accent/25" />
              <div className="absolute top-[55%] left-[70%] h-2.5 w-2.5 rounded-full bg-accent/25" />
              {/* Scout highlight indicator */}
              <div className="absolute top-[35%] left-[65%] h-7 w-7 -translate-x-[9px] -translate-y-[9px] rounded-full border-2 border-accent/40 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
