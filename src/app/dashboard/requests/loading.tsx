export default function RequestsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-36 rounded bg-background-secondary" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex items-center justify-between p-4">
            <div className="space-y-1.5">
              <div className="h-4 w-48 rounded bg-background-secondary" />
              <div className="h-3 w-32 rounded bg-background-secondary" />
            </div>
            <div className="h-6 w-16 rounded-full bg-background-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}
