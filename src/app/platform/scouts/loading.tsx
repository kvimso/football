export default function PlatformScoutsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 rounded bg-background-secondary" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-14" />
        ))}
      </div>
    </div>
  )
}
