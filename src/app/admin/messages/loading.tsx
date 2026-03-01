export default function AdminMessagesLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 rounded bg-background-secondary" />
      <div className="mt-1 h-4 w-48 rounded bg-background-secondary" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-3 p-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-background-secondary" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-background-secondary" />
                <div className="h-3 w-16 rounded bg-background-secondary" />
              </div>
              <div className="h-3 w-48 rounded bg-background-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
