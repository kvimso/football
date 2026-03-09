export default function EditPlayerLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-4 w-28 rounded bg-background-secondary" />
      <div className="mb-6 h-7 w-36 rounded bg-background-secondary" />
      <div className="space-y-6">
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-16 rounded bg-background-secondary" />
            <div className="h-16 rounded bg-background-secondary" />
          </div>
        </div>
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-16 rounded bg-background-secondary" />
            <div className="h-16 rounded bg-background-secondary" />
            <div className="h-16 rounded bg-background-secondary" />
          </div>
        </div>
      </div>
    </div>
  )
}
