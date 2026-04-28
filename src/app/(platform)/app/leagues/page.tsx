const LEAGUES = [
  { name: 'U-19 Premier', matchday: 18, matchdays: 30, teams: 12, status: 'live' },
  { name: 'U-17 Premier', matchday: 16, matchdays: 28, teams: 10, status: 'live' },
  { name: 'U-15 Premier', matchday: 14, matchdays: 26, teams: 12, status: 'live' },
  { name: 'U-19 Regional A', matchday: 12, matchdays: 24, teams: 10, status: 'live' },
  { name: "Women's U-19", matchday: 8, matchdays: 18, teams: 8, status: 'live' },
] as const

export default function AppLeaguesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Leagues</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Youth competitions tracked across Georgia.
        </p>
        <span className="mt-3 inline-block rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] uppercase tracking-wider text-foreground-faint">
          Beta
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border px-5 py-3 text-xs uppercase tracking-wider text-foreground-faint">
          <span>League</span>
          <span>Teams</span>
          <span>Matchday</span>
        </div>
        {LEAGUES.map((l) => (
          <div
            key={l.name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 hover:bg-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-medium">{l.name}</span>
            </div>
            <span className="text-sm text-foreground-secondary">{l.teams}</span>
            <span className="text-sm text-foreground-secondary">
              {l.matchday} / {l.matchdays}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
