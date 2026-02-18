export default function ClubDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="h-4 w-28 rounded bg-background-secondary" />
      <div className="mt-4 flex items-start gap-5">
        <div className="h-20 w-20 shrink-0 rounded-2xl bg-background-secondary" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-background-secondary" />
          <div className="h-4 w-32 rounded bg-background-secondary" />
        </div>
      </div>
      <div className="mt-10">
        <div className="mb-6 h-7 w-24 rounded bg-background-secondary" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="h-40 rounded bg-background-secondary" />
              <div className="mt-3 h-5 w-3/4 rounded bg-background-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
