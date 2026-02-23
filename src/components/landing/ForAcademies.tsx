import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
import { CheckCircleIcon } from '@/components/ui/Icons'

export async function ForAcademies() {
  const { t } = await getServerT()

  const benefits = [
    t('landing.academyBenefit1'),
    t('landing.academyBenefit2'),
    t('landing.academyBenefit3'),
    t('landing.academyBenefit4'),
    t('landing.academyBenefit5'),
  ]

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — decorative formation diagram */}
          <div className="hidden lg:flex items-center justify-center order-2 lg:order-1" aria-hidden="true">
            <div className="relative h-72 w-full max-w-sm">
              {/* Shield / crest shape */}
              <div className="absolute inset-4 rounded-xl border-2 border-accent/10" />
              {/* Inner border */}
              <div className="absolute inset-8 rounded-lg border border-accent/[0.07]" />
              {/* Formation dots (4-3-3) */}
              {/* GK */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-amber-500/30" />
              {/* DEF line */}
              <div className="absolute bottom-24 left-[20%] h-2.5 w-2.5 rounded-full bg-blue-500/25" />
              <div className="absolute bottom-28 left-[38%] h-2.5 w-2.5 rounded-full bg-blue-500/25" />
              <div className="absolute bottom-28 right-[38%] h-2.5 w-2.5 rounded-full bg-blue-500/25" />
              <div className="absolute bottom-24 right-[20%] h-2.5 w-2.5 rounded-full bg-blue-500/25" />
              {/* MID line */}
              <div className="absolute top-[42%] left-[28%] h-2.5 w-2.5 rounded-full bg-cyan-500/25" />
              <div className="absolute top-[38%] left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-cyan-500/25" />
              <div className="absolute top-[42%] right-[28%] h-2.5 w-2.5 rounded-full bg-cyan-500/25" />
              {/* ATT line */}
              <div className="absolute top-[18%] left-[25%] h-2.5 w-2.5 rounded-full bg-purple-500/25" />
              <div className="absolute top-[15%] left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-purple-500/25" />
              <div className="absolute top-[18%] right-[25%] h-2.5 w-2.5 rounded-full bg-purple-500/25" />
              {/* Connecting lines */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border border-dashed border-accent/[0.08]" />
            </div>
          </div>

          {/* Right — content */}
          <div className="order-1 lg:order-2">
            <div className="inline-block h-1 w-12 rounded-full bg-accent mb-4" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.forAcademiesTitle')}
            </h2>
            <p className="mt-4 text-foreground-muted leading-relaxed">
              {t('landing.forAcademiesSubtitle')}
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
              <Link href="/login" className="btn-primary px-8 py-3 text-base font-semibold">
                {t('landing.academyCta')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
