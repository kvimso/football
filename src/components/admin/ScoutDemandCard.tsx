import { COUNTRY_FLAGS } from '@/lib/constants'

interface DemandEntry {
  country: string
  view_count: number
}

interface ScoutDemandCardProps {
  title: string
  noDataLabel: string
  trendLabel: string
  thisMonth: DemandEntry[]
  lastMonth: DemandEntry[]
}

export function ScoutDemandCard({ title, noDataLabel, trendLabel, thisMonth, lastMonth }: ScoutDemandCardProps) {
  const totalThisMonth = thisMonth.reduce((sum, e) => sum + Number(e.view_count), 0)
  const totalLastMonth = lastMonth.reduce((sum, e) => sum + Number(e.view_count), 0)
  const trendPercent = totalLastMonth > 0
    ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
    : totalThisMonth > 0 ? 100 : 0

  // Build last month lookup for per-country trend
  const lastMonthMap = new Map(lastMonth.map(e => [e.country, Number(e.view_count)]))

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">{title}</h2>
        {totalThisMonth > 0 && trendPercent !== 0 && (
          <span className={`text-xs font-medium ${trendPercent > 0 ? 'text-accent' : 'text-red-400'}`}>
            {trendPercent > 0 ? '+' : ''}{trendPercent}% {trendLabel}
          </span>
        )}
      </div>

      {thisMonth.length > 0 ? (
        <div className="mt-4 space-y-2">
          {thisMonth.map((entry) => {
            const flag = COUNTRY_FLAGS[entry.country] ?? COUNTRY_FLAGS['Unknown'] ?? ''
            const prevCount = lastMonthMap.get(entry.country) ?? 0
            const count = Number(entry.view_count)
            const isUp = count > prevCount
            const isDown = count < prevCount && prevCount > 0

            return (
              <div key={entry.country} className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="text-base">{flag}</span>
                  {entry.country}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
                  {count}
                  {isUp && (
                    <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  )}
                  {isDown && (
                    <svg className="h-3 w-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                    </svg>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-background py-8 text-center">
          <svg className="h-10 w-10 text-foreground-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          <p className="mt-2 text-sm text-foreground-muted">{noDataLabel}</p>
        </div>
      )}
    </div>
  )
}
