export default function PlayersLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 rounded bg-background-secondary" />
        <div className="mt-2 h-4 w-72 rounded bg-background-secondary" />
      </div>
      <div className="h-12 rounded-lg bg-background-secondary" />
      <div className="mt-6 mb-4 h-4 w-32 rounded bg-background-secondary" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-40 rounded bg-background-secondary" />
            <div className="mt-3 h-5 w-3/4 rounded bg-background-secondary" />
            <div className="mt-2 h-4 w-1/2 rounded bg-background-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}
