import type { TeamStatSummary } from '@/lib/camera/extract'

interface TeamComparisonStatsProps {
  homeStats: Record<string, TeamStatSummary>
  awayStats: Record<string, TeamStatSummary>
  homePossession: number | null
  awayPossession: number | null
  t: (key: string) => string
}

function StatBar({
  homeVal,
  awayVal,
  label,
  format = 'count',
}: {
  homeVal: number
  awayVal: number
  label: string
  format?: 'count' | 'decimal' | 'percent'
}) {
  const total = homeVal + awayVal
  const homePercent = total > 0 ? Math.max((homeVal / total) * 100, 2) : 50
  const awayPercent = total > 0 ? 100 - homePercent : 50
  const isEmpty = total === 0

  const formatVal = (v: number) => {
    if (format === 'decimal') return v.toFixed(1)
    if (format === 'percent') return `${Math.round(v)}%`
    return String(Math.round(v))
  }

  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground tabular-nums">
          {isEmpty ? '—' : formatVal(homeVal)}
        </span>
        <span className="text-foreground-muted">{label}</span>
        <span className="font-semibold text-foreground tabular-nums">
          {isEmpty ? '—' : formatVal(awayVal)}
        </span>
      </div>
      {!isEmpty && (
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          <div
            className="rounded-l-full bg-primary transition-all"
            style={{ width: `${homePercent}%` }}
          />
          <div
            className="rounded-r-full bg-foreground-muted/40 transition-all"
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function TeamComparisonStats({
  homeStats,
  awayStats,
  homePossession,
  awayPossession,
  t,
}: TeamComparisonStatsProps) {
  return (
    <div className="divide-y divide-border/50">
      <StatBar
        homeVal={homePossession ?? 0}
        awayVal={awayPossession ?? 0}
        label={t('matches.possession')}
        format="percent"
      />
      <StatBar
        homeVal={homeStats['expected_goals']?.value ?? 0}
        awayVal={awayStats['expected_goals']?.value ?? 0}
        label={t('matches.xG')}
        format="decimal"
      />
      <StatBar
        homeVal={homeStats['shots']?.count ?? 0}
        awayVal={awayStats['shots']?.count ?? 0}
        label={t('matches.shots')}
      />
      <StatBar
        homeVal={homeStats['shots']?.accurate ?? 0}
        awayVal={awayStats['shots']?.accurate ?? 0}
        label={t('stats.shotsOnTarget')}
      />
      <StatBar
        homeVal={homeStats['passes']?.count ?? 0}
        awayVal={awayStats['passes']?.count ?? 0}
        label={t('matches.totalPasses')}
      />
      <StatBar
        homeVal={homeStats['passes']?.percent ?? 0}
        awayVal={awayStats['passes']?.percent ?? 0}
        label={t('stats.passPercent')}
        format="percent"
      />
      <StatBar
        homeVal={homeStats['tackles']?.count ?? 0}
        awayVal={awayStats['tackles']?.count ?? 0}
        label={t('stats.tackles')}
      />
      <StatBar
        homeVal={homeStats['corners']?.count ?? 0}
        awayVal={awayStats['corners']?.count ?? 0}
        label={t('matches.corners')}
      />
      <StatBar
        homeVal={homeStats['free_kicks']?.count ?? 0}
        awayVal={awayStats['free_kicks']?.count ?? 0}
        label={t('matches.freeKicks')}
      />
      <StatBar
        homeVal={homeStats['fouls']?.count ?? 0}
        awayVal={awayStats['fouls']?.count ?? 0}
        label={t('matches.fouls')}
      />
    </div>
  )
}
