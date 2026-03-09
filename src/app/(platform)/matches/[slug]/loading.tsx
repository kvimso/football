export default function MatchDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="h-4 w-32 rounded bg-background-secondary" />
      <div className="mt-6 card p-6">
        <div className="flex items-center justify-center gap-8">
          <div className="h-6 w-28 rounded bg-background-secondary" />
          <div className="h-10 w-20 rounded bg-background-secondary" />
          <div className="h-6 w-28 rounded bg-background-secondary" />
        </div>
        <div className="mt-4 h-4 w-48 mx-auto rounded bg-background-secondary" />
      </div>
      <div className="mt-6 card h-64" />
    </div>
  )
}
