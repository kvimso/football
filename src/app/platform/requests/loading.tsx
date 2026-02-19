export default function PlatformRequestsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 rounded bg-background-secondary" />
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded bg-background-secondary" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
    </div>
  )
}
