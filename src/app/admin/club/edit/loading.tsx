export default function ClubEditLoading() {
  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-elevated" />
        <div className="h-9 w-80 rounded bg-elevated" />
        <div className="h-4 w-96 rounded bg-elevated" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6">
            <div className="h-5 w-32 rounded bg-elevated" />
            <div className="mt-4 h-24 rounded bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  )
}
