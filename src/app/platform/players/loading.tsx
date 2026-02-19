export default function PlatformPlayersLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 rounded bg-background-secondary" />
        <div className="h-9 w-28 rounded bg-background-secondary" />
      </div>
      <div className="mt-4 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-32 rounded bg-background-secondary" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-14" />
        ))}
      </div>
    </div>
  )
}
