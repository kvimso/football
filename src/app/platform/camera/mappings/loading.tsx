export default function PlayerMappingsLoading() {
  return (
    <div className="animate-skeleton-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-44 rounded bg-elevated" />
          <div className="mt-2 h-4 w-72 rounded bg-elevated" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-elevated" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded bg-elevated" />
        ))}
      </div>
    </div>
  )
}
