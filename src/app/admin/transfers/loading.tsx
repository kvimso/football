export default function AdminTransfersLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 rounded bg-background-secondary" />
      <div className="mt-6 h-12 rounded-lg bg-background-secondary" />
      <div className="mt-8 h-5 w-36 rounded bg-background-secondary" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-16" />
        ))}
      </div>
      <div className="mt-8 h-5 w-36 rounded bg-background-secondary" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-16" />
        ))}
      </div>
    </div>
  )
}
