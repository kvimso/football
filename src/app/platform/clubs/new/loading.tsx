export default function PlatformNewClubLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 rounded bg-background-secondary" />
      <div className="mt-6 card p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-background-secondary" />
        ))}
      </div>
    </div>
  )
}
