import { getServerT } from '@/lib/server-translations'

interface StatsBarProps {
  players: number
  clubs: number
  matches: number
}

export async function StatsBar({ players, clubs, matches }: StatsBarProps) {
  const { t } = await getServerT()

  const stats = [
    { value: players, label: t('home.totalPlayers') },
    { value: clubs, label: t('home.totalClubs') },
    { value: matches, label: t('home.totalMatches') },
  ]

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-6 sm:gap-8 sm:py-8 md:gap-12">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background-secondary px-6 py-4 text-center sm:px-8">
            <div className="text-2xl font-extrabold text-accent sm:text-3xl">{stat.value}</div>
            <div className="mt-1 text-sm text-foreground-muted">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
