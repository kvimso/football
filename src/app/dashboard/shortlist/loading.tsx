export default function ShortlistLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 rounded bg-background-secondary" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-background-secondary" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded bg-background-secondary" />
                <div className="h-3 w-20 rounded bg-background-secondary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
