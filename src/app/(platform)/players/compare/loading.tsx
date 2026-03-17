export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-skeleton-in">
      {/* Title */}
      <div className="h-8 w-48 rounded bg-elevated mb-6" />
      {/* Player selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <div className="h-10 rounded-lg bg-elevated" />
        <div className="h-10 rounded-lg bg-elevated" />
      </div>
      {/* Verdict bar */}
      <div className="mx-auto max-w-4xl">
        <div className="h-12 rounded-lg bg-elevated mb-6" />
        {/* Radar chart */}
        <div className="mx-auto h-64 w-64 rounded-lg bg-elevated mb-6" />
        {/* Bars */}
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-8 rounded bg-elevated" />
          ))}
        </div>
      </div>
    </div>
  )
}
