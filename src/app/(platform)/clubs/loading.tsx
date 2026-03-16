export default function ClubsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-40 rounded bg-elevated" />
        <div className="mt-2 h-4 w-64 rounded bg-elevated" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-elevated" />
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-elevated" />
                <div className="h-4 w-24 rounded bg-elevated" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
