import Link from 'next/link'

interface StatItem {
  label: string
  value: number
  href: string
  icon: string
  trend?: number
  subtitle?: string
}

export function DashboardStatCards({ stats, trendLabel }: { stats: StatItem[]; trendLabel: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-accent/30 hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="mt-0.5 text-xs text-foreground-muted">{stat.label}</p>
          {stat.trend != null && stat.trend !== 0 && (
            <p className={`mt-1 text-xs font-medium ${stat.trend > 0 ? 'text-accent' : 'text-red-400'}`}>
              {stat.trend > 0 ? '+' : ''}{stat.trend}% {trendLabel}
            </p>
          )}
          {stat.subtitle && (
            <p className="mt-1 truncate text-[11px] text-foreground-muted/70">{stat.subtitle}</p>
          )}
        </Link>
      ))}
    </div>
  )
}
