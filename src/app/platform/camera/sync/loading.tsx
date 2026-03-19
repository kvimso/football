export default function SyncDashboardLoading() {
  return (
    <div className="animate-skeleton-in space-y-8">
      <div className="card p-6">
        <div className="h-6 w-32 rounded bg-elevated" />
        <div className="mt-2 h-4 w-64 rounded bg-elevated" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="h-10 rounded bg-elevated" />
          <div className="h-10 rounded bg-elevated" />
        </div>
        <div className="mt-4 h-9 w-32 rounded-lg bg-elevated" />
      </div>
      <div>
        <div className="h-6 w-32 rounded bg-elevated" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-elevated" />
          ))}
        </div>
      </div>
    </div>
  )
}
