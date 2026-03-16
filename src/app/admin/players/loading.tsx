export default function AdminPlayersLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 rounded bg-elevated" />
        <div className="h-9 w-28 rounded bg-elevated" />
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-elevated" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-elevated" />
                <div className="h-3 w-20 rounded bg-elevated" />
              </div>
            </div>
            <div className="h-4 w-16 rounded bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  )
}
