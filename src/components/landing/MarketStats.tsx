import { getServerT } from '@/lib/server-translations'

export async function MarketStats() {
  const { t } = await getServerT()

  const stats = [
    { value: t('landing.statsYouthPlayers'), label: t('landing.statsYouthPlayersLabel') },
    { value: t('landing.statsTransferValue'), label: t('landing.statsTransferValueLabel') },
    { value: t('landing.statsAcademies'), label: t('landing.statsAcademiesLabel') },
  ]

  return (
    <section className="relative py-16 sm:py-20">
      <div className="hex-pattern absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:justify-center sm:gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <div className="text-center px-8 sm:px-12">
                <div className="text-4xl font-extrabold text-accent sm:text-5xl tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
                  {stat.label}
                </div>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden sm:block h-12 w-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
