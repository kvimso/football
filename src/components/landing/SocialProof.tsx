import { getServerT } from '@/lib/server-translations'
import { LandingCountUp } from './LandingCountUp'

export async function SocialProof() {
  const { t } = await getServerT()

  const stats = [
    {
      label: t('landing.statsYouthPlayersLabel'),
      numericValue: 37600,
      suffix: '+',
    },
    {
      label: t('landing.statsAcademiesLabel'),
      numericValue: 200,
      suffix: '+',
    },
    {
      label: t('landing.statsCameraVerifiedLabel'),
      qualitativeValue: t('landing.statsCameraVerified'),
    },
  ] as const

  return (
    <section className="bg-surface py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <div className="text-center px-8 sm:px-12">
                <div
                  className={`font-semibold tracking-tight ${
                    'qualitativeValue' in stat
                      ? 'text-3xl text-primary sm:text-4xl'
                      : 'text-3xl sm:text-4xl'
                  }`}
                >
                  {'qualitativeValue' in stat ? (
                    stat.qualitativeValue
                  ) : (
                    <LandingCountUp target={stat.numericValue} suffix={stat.suffix} />
                  )}
                </div>
                <div className="mt-1.5 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                  {stat.label}
                </div>
              </div>
              {i < stats.length - 1 && <div className="hidden sm:block h-10 w-px bg-border" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
