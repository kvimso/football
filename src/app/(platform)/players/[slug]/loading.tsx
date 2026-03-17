export default function PlayerProfileLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-skeleton-in">
      {/* Back link */}
      <div className="h-4 w-32 rounded bg-elevated" />

      {/* Hero card */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col md:flex-row">
          <div className="h-64 w-full shrink-0 bg-elevated md:h-72 md:w-60" />
          <div className="flex-1 space-y-3 p-5">
            <div className="h-7 w-48 rounded bg-elevated" />
            <div className="h-5 w-32 rounded bg-elevated" />
            <div className="mt-4 flex gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-9 w-12 rounded bg-elevated" />
                  <div className="h-3 w-10 rounded bg-elevated" />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-elevated" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-nav bar */}
      <div className="-mx-4 mt-0 flex gap-6 border-b border-border px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-16 rounded bg-elevated" />
        ))}
      </div>

      {/* Stats section */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-xl border border-border bg-surface p-5" />
        <div className="h-64 rounded-xl border border-border bg-surface p-5 lg:col-span-2" />
      </div>

      {/* Season cards */}
      <div className="mt-6 flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 min-w-[200px] shrink-0 rounded-xl border border-border bg-surface"
          />
        ))}
      </div>
    </div>
  )
}
