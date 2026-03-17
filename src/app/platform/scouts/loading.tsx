export default function PlatformScoutsLoading() {
  return (
    <div className="animate-skeleton-in">
      <div className="h-7 w-32 rounded bg-elevated" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-14" />
        ))}
      </div>
    </div>
  )
}
