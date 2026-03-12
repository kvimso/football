export default function NotificationsLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-36 rounded bg-card-hover" />
        <div className="h-4 w-28 rounded bg-card-hover" />
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <div className="h-8 w-28 rounded-lg bg-card-hover" />
        <div className="h-8 w-24 rounded-lg bg-card-hover" />
      </div>

      {/* Notification rows */}
      <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border/50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <div className="mt-0.5 h-4 w-4 rounded bg-card-hover shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-card-hover" />
              <div className="h-3 w-1/2 rounded bg-card-hover" />
              <div className="h-4 w-16 rounded-full bg-card-hover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
