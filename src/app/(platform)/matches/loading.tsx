export default function MatchesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-40 rounded bg-card-hover" />
        <div className="mt-2 h-4 w-64 rounded bg-card-hover" />
      </div>
      <div className="h-10 w-48 rounded-lg bg-card-hover" />
      <div className="mt-6 mb-4 h-4 w-28 rounded bg-card-hover" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 rounded bg-card-hover" />
              <div className="h-5 w-8 rounded bg-card-hover" />
              <div className="h-5 w-20 rounded bg-card-hover" />
            </div>
            <div className="mt-3 h-4 w-32 rounded bg-card-hover" />
          </div>
        ))}
      </div>
    </div>
  )
}
