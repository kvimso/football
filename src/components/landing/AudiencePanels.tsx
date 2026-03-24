import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export async function AudiencePanels() {
  const { t } = await getServerT()

  const scoutBenefits = [
    t('landing.scoutBenefit1'),
    t('landing.scoutBenefit2'),
    t('landing.scoutBenefit3'),
    t('landing.scoutBenefit4'),
  ]

  const academyBenefits = [
    t('landing.academyBenefit1'),
    t('landing.academyBenefit2'),
    t('landing.academyBenefit3'),
    t('landing.academyBenefit4'),
  ]

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* For Scouts */}
        <div
          id="for-scouts"
          className="scroll-mt-[calc(var(--navbar-height)+1rem)] bg-surface px-6 py-12 sm:px-10 sm:py-16 lg:px-16"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t('nav.forScouts')}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {t('landing.forScoutsSubtitle')}
          </h2>

          <ul className="mt-8 space-y-4">
            {scoutBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-3">
                <svg
                  className="h-5 w-5 shrink-0 text-primary mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm leading-relaxed text-foreground-secondary">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link href="/demo" className="btn-primary px-6 py-2.5 text-sm font-semibold">
              {t('landing.scoutCta')} &rarr;
            </Link>
          </div>
        </div>

        {/* For Academies */}
        <div
          id="for-academies"
          className="scroll-mt-[calc(var(--navbar-height)+1rem)] bg-elevated px-6 py-12 sm:px-10 sm:py-16 lg:px-16"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t('nav.forAcademies')}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {t('landing.forAcademiesSubtitle')}
          </h2>

          <ul className="mt-8 space-y-4">
            {academyBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-3">
                <svg
                  className="h-5 w-5 shrink-0 text-primary mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm leading-relaxed text-foreground-secondary">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link href="/login" className="btn-primary px-6 py-2.5 text-sm font-semibold">
              {t('landing.academyCta')} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
