export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-36 rounded bg-background-secondary" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-4 w-24 rounded bg-background-secondary" />
            <div className="mt-2 h-8 w-12 rounded bg-background-secondary" />
          </div>
        ))}
      </div>
      <div className="mt-8 h-5 w-28 rounded bg-background-secondary" />
      <div className="mt-3 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-20" />
        ))}
      </div>
    </div>
  )
}
