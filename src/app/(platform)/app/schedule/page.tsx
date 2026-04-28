const FIXTURES = [
  {
    date: 'Sat, Apr 20',
    time: '14:00',
    home: 'Dinamo Tbilisi',
    away: 'Iberia 1999',
    league: 'U-19 Premier',
  },
  {
    date: 'Sat, Apr 20',
    time: '16:30',
    home: 'Torpedo Kutaisi',
    away: 'Locomotive',
    league: 'U-19 Premier',
  },
  {
    date: 'Sun, Apr 21',
    time: '12:00',
    home: 'Dila Gori',
    away: 'Dinamo Tbilisi',
    league: 'U-17 Premier',
  },
  {
    date: 'Sun, Apr 21',
    time: '15:00',
    home: 'Iberia 1999',
    away: 'Torpedo Kutaisi',
    league: 'U-17 Premier',
  },
  {
    date: 'Wed, Apr 24',
    time: '17:00',
    home: 'Locomotive',
    away: 'Dila Gori',
    league: 'U-15 Premier',
  },
  {
    date: 'Sat, Apr 27',
    time: '14:00',
    home: 'Dinamo Tbilisi',
    away: 'Torpedo Kutaisi',
    league: 'U-19 Premier',
  },
  {
    date: 'Sat, Apr 27',
    time: '16:30',
    home: 'Iberia 1999',
    away: 'Locomotive',
    league: 'U-19 Regional A',
  },
] as const

export default function AppSchedulePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Upcoming fixtures across all leagues.
        </p>
        <span className="mt-3 inline-block rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] uppercase tracking-wider text-foreground-faint">
          Beta
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {FIXTURES.map((f, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 hover:bg-elevated transition-colors"
          >
            <div className="w-24 shrink-0">
              <div className="text-xs font-medium">{f.date}</div>
              <div className="text-[11px] text-foreground-faint">{f.time}</div>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {f.home} <span className="text-foreground-faint">vs</span> {f.away}
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wider text-foreground-faint">
                {f.league}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
