import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export async function AudiencePanels() {
  const { t } = await getServerT()

  const panels = [
    {
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      ),
      title: t('landing.forScoutsTitle'),
      description: t('landing.forScoutsDesc'),
      benefits: [
        t('landing.scoutBenefit1'),
        t('landing.scoutBenefit2'),
        t('landing.scoutBenefit3'),
      ],
      cta: t('landing.scoutCta'),
      href: '/register',
    },
    {
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
      ),
      title: t('landing.forAcademiesTitle'),
      description: t('landing.forAcademiesDesc'),
      benefits: [
        t('landing.academyBenefit1'),
        t('landing.academyBenefit2'),
        t('landing.academyBenefit3'),
      ],
      cta: t('landing.academyCta'),
      href: '/register',
    },
  ]

  return (
    <section className="bg-surface py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {panels.map((panel) => (
            <div
              key={panel.title}
              className="rounded-2xl border border-border bg-background p-7 sm:p-9"
            >
              {/* Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
                {panel.icon}
              </div>

              {/* Title + description */}
              <h3 className="mt-5 text-xl font-extrabold tracking-tight">{panel.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {panel.description}
              </p>

              {/* Checklist */}
              <ul className="mt-5 space-y-2.5">
                {panel.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5">
                    <svg
                      className="h-4 w-4 shrink-0 text-primary mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-7">
                <Link
                  href={panel.href}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-surface py-2.5 text-sm font-bold text-primary transition-colors hover:bg-elevated"
                >
                  {panel.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
