export default function PlatformNewPlayerLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-36 rounded bg-background-secondary" />
      <div className="mt-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-4">
            <div className="h-10 rounded bg-background-secondary" />
            <div className="h-10 rounded bg-background-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}
