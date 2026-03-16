export default function PlayersLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 rounded bg-elevated" />
        <div className="mt-2 h-4 w-72 rounded bg-elevated" />
      </div>
      <div className="h-12 rounded-lg bg-elevated" />
      <div className="mt-6 mb-4 flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-elevated" />
        <div className="flex gap-1">
          <div className="h-7 w-7 rounded-md bg-elevated" />
          <div className="h-7 w-7 rounded-md bg-elevated" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card">
            {/* Photo + name row */}
            <div className="flex gap-3">
              <div className="h-14 w-14 shrink-0 rounded-md bg-elevated" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded bg-elevated" />
                <div className="h-3 w-1/2 rounded bg-elevated" />
              </div>
            </div>
            {/* Stat chips */}
            <div className="mt-3 flex gap-2">
              <div className="flex-1 h-10 rounded bg-elevated" />
              <div className="flex-1 h-10 rounded bg-elevated" />
              <div className="flex-1 h-10 rounded bg-elevated" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
