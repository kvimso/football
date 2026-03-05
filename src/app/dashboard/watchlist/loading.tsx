export default function WatchlistLoading() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row animate-pulse">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block lg:w-56 shrink-0">
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="h-3 w-16 rounded bg-background-secondary" />
          <div className="h-7 w-full rounded bg-background-secondary" />
          <div className="h-7 w-full rounded bg-background-secondary" />
          <div className="h-7 w-full rounded bg-background-secondary" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 min-w-0">
        {/* Filter bar */}
        <div className="mb-4 flex gap-2">
          <div className="h-8 flex-1 rounded-lg bg-background-secondary" />
          <div className="h-8 w-24 rounded-lg bg-background-secondary" />
        </div>

        {/* Header */}
        <div className="mb-3 h-6 w-32 rounded bg-background-secondary" />

        {/* Player rows */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-background-secondary" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-background-secondary" />
                  <div className="h-3 w-20 rounded bg-background-secondary" />
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                <div className="h-5 w-14 rounded-full bg-background-secondary" />
                <div className="h-5 w-16 rounded-full bg-background-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
