export default function PlatformScoutDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-24 rounded bg-background-secondary" />
      <div className="mt-4 h-7 w-48 rounded bg-background-secondary" />
      <div className="mt-4 card p-4">
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 rounded bg-background-secondary" />
              <div className="mt-1 h-5 w-28 rounded bg-background-secondary" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-16" />
        ))}
      </div>
    </div>
  )
}
