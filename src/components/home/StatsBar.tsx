'use client'

import { useLang } from '@/hooks/useLang'

interface StatsBarProps {
  players: number
  clubs: number
  matches: number
}

export function StatsBar({ players, clubs, matches }: StatsBarProps) {
  const { t } = useLang()

  const stats = [
    { value: players, label: t('home.totalPlayers') },
    { value: clubs, label: t('home.totalClubs') },
    { value: matches, label: t('home.totalMatches') },
  ]

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-12 px-4 py-8 sm:gap-20">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl font-bold text-accent">{stat.value}</div>
            <div className="mt-1 text-sm text-foreground-muted">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
