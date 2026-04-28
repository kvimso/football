const CLUBS = [
  { name: 'Dinamo Tbilisi', founded: 1925, location: 'Tbilisi', players: 58 },
  { name: 'Torpedo Kutaisi', founded: 1946, location: 'Kutaisi', players: 47 },
  { name: 'Iberia 1999', founded: 1999, location: 'Tbilisi', players: 41 },
  { name: 'Locomotive Tbilisi', founded: 1936, location: 'Tbilisi', players: 38 },
  { name: 'Dila Gori', founded: 1949, location: 'Gori', players: 32 },
] as const

export default function AppClubsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Clubs</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Registered academies on the platform.
        </p>
        <span className="mt-3 inline-block rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] uppercase tracking-wider text-foreground-faint">
          Beta
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CLUBS.map((c) => (
          <div
            key={c.name}
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-elevated"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-medium">{c.name}</div>
                <div className="mt-1 text-xs text-foreground-secondary">
                  Founded {c.founded} · {c.location}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold">{c.players}</div>
                <div className="text-[11px] uppercase tracking-wider text-foreground-faint">
                  Players
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
