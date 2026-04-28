const TABLE = [
  { rank: 1, club: 'Dinamo Tbilisi', p: 18, w: 14, d: 2, l: 2, gd: 34, pts: 44 },
  { rank: 2, club: 'Torpedo Kutaisi', p: 18, w: 12, d: 3, l: 3, gd: 22, pts: 39 },
  { rank: 3, club: 'Iberia 1999', p: 18, w: 11, d: 3, l: 4, gd: 17, pts: 36 },
  { rank: 4, club: 'Locomotive', p: 18, w: 9, d: 4, l: 5, gd: 10, pts: 31 },
  { rank: 5, club: 'Dila Gori', p: 18, w: 7, d: 5, l: 6, gd: 2, pts: 26 },
  { rank: 6, club: 'Samtredia', p: 18, w: 6, d: 4, l: 8, gd: -5, pts: 22 },
  { rank: 7, club: 'Saburtalo', p: 18, w: 4, d: 5, l: 9, gd: -12, pts: 17 },
  { rank: 8, club: 'Shukura', p: 18, w: 3, d: 3, l: 12, gd: -20, pts: 12 },
] as const

export default function AppStandingsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Standings</h1>
        <p className="mt-2 text-sm text-foreground-secondary">U-19 Premier · Matchday 18</p>
        <span className="mt-3 inline-block rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] uppercase tracking-wider text-foreground-faint">
          Beta
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[40px_1fr_40px_40px_40px_40px_56px_56px] items-center gap-3 border-b border-border px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-foreground-faint">
          <span>#</span>
          <span>Club</span>
          <span className="text-right">P</span>
          <span className="text-right">W</span>
          <span className="text-right">D</span>
          <span className="text-right">L</span>
          <span className="text-right">GD</span>
          <span className="text-right">Pts</span>
        </div>
        {TABLE.map((row) => (
          <div
            key={row.rank}
            className="grid grid-cols-[40px_1fr_40px_40px_40px_40px_56px_56px] items-center gap-3 border-b border-border px-5 py-3 text-sm last:border-b-0 hover:bg-elevated transition-colors"
          >
            <span className="text-foreground-faint">{row.rank}</span>
            <span className="font-medium">{row.club}</span>
            <span className="text-right text-foreground-secondary">{row.p}</span>
            <span className="text-right text-foreground-secondary">{row.w}</span>
            <span className="text-right text-foreground-secondary">{row.d}</span>
            <span className="text-right text-foreground-secondary">{row.l}</span>
            <span className="text-right text-foreground-secondary">
              {row.gd > 0 ? `+${row.gd}` : row.gd}
            </span>
            <span className="text-right font-semibold">{row.pts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
