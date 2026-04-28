const PLAYERS = [
  { name: 'Nika Kobakhidze', position: 'DEF', age: 17, club: 'Iberia 1999', verified: true },
  { name: 'Aleko Basiladze', position: 'ATT', age: 19, club: 'Torpedo Kutaisi', verified: true },
  { name: 'Luka Tabatadze', position: 'MID', age: 18, club: 'Dinamo Tbilisi', verified: true },
  { name: 'Giorgi Cereteli', position: 'MID', age: 20, club: 'Locomotive Tbilisi', verified: true },
  {
    name: 'Amiran Tkeshelashvili',
    position: 'MID',
    age: 18,
    club: 'Torpedo Kutaisi',
    verified: false,
  },
  { name: 'Dimitri Maisuradze', position: 'DEF', age: 19, club: 'Torpedo Kutaisi', verified: true },
  {
    name: 'Saba Gogichaishvili',
    position: 'ATT',
    age: 17,
    club: 'Dinamo Tbilisi',
    verified: false,
  },
  { name: 'Tornike Dvalishvili', position: 'GK', age: 18, club: 'Iberia 1999', verified: true },
] as const

const POSITION_BG: Record<string, string> = {
  GK: 'bg-pos-gk-bg text-pos-gk',
  DEF: 'bg-pos-def-bg text-pos-def',
  MID: 'bg-pos-mid-bg text-pos-mid',
  ATT: 'bg-pos-att-bg text-pos-att',
}

export default function AppPlayersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Players</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Browse youth talent across Georgian academies.
        </p>
        <span className="mt-3 inline-block rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] uppercase tracking-wider text-foreground-faint">
          Beta
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PLAYERS.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-elevated"
          >
            <div className="h-10 w-10 rounded-full bg-elevated" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{p.name}</span>
                {p.verified && (
                  <span className="rounded-full bg-pos-mid-bg px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-pos-mid">
                    Verified
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-foreground-secondary">
                {p.age} · {p.club}
              </div>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${POSITION_BG[p.position] ?? 'bg-elevated text-foreground-secondary'}`}
            >
              {p.position}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
