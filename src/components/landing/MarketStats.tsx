import { getServerT } from '@/lib/server-translations'

export async function MarketStats() {
  const { t } = await getServerT()

  const stats = [
    { value: t('landing.statsYouthPlayers'), label: t('landing.statsYouthPlayersLabel') },
    { value: t('landing.statsTransferValue'), label: t('landing.statsTransferValueLabel') },
    { value: t('landing.statsAcademies'), label: t('landing.statsAcademiesLabel') },
  ]

  return (
    <section className="border-y border-border bg-background-secondary py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-accent sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-foreground-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
