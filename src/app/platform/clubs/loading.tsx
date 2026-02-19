export default function PlatformClubsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-background-secondary" />
        <div className="h-9 w-24 rounded bg-background-secondary" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-16" />
        ))}
      </div>
    </div>
  )
}
