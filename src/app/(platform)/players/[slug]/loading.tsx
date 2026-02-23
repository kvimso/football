export default function PlayerProfileLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="h-4 w-32 rounded bg-background-secondary" />
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:gap-10">
        <div className="h-56 w-56 shrink-0 rounded-2xl bg-background-secondary" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 rounded bg-background-secondary" />
          <div className="h-5 w-32 rounded bg-background-secondary" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-background-secondary" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card h-64" />
        <div className="card h-64 lg:col-span-2" />
      </div>
    </div>
  )
}
