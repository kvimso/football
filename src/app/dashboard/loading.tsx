export default function DashboardLoading() {
  return (
    <div className="animate-skeleton-in">
      {/* Welcome header */}
      <div className="h-7 w-48 rounded bg-elevated" />
      <div className="mt-1 h-4 w-32 rounded bg-elevated" />

      {/* Stat summary */}
      <div className="mt-4 flex gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-5 w-36 rounded bg-elevated" />
        ))}
      </div>

      {/* 60/40 split */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Activity feed */}
        <div className="space-y-3">
          <div className="h-5 w-32 rounded bg-elevated" />
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <div className="h-4 w-4 rounded bg-elevated" />
              <div className="flex-1 h-4 rounded bg-elevated" />
              <div className="h-3 w-12 rounded bg-elevated" />
            </div>
          ))}
        </div>

        {/* Watchlist panel */}
        <div className="hidden md:block">
          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <div className="h-5 w-24 rounded bg-elevated" />
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-elevated" />
                <div className="flex-1 h-4 rounded bg-elevated" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
