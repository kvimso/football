export default function PlatformTransfersLoading() {
  return (
    <div className="animate-skeleton-in">
      <div className="h-7 w-40 rounded bg-elevated" />
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded bg-elevated" />
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
