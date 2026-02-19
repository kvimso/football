export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="h-8 w-48 rounded bg-background-secondary" />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card h-80" />
        <div className="card h-80" />
      </div>
    </div>
  )
}
