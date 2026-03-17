export default function PlatformInviteLoading() {
  return (
    <div className="animate-skeleton-in">
      <div className="h-7 w-48 rounded bg-elevated" />
      <div className="mt-2 h-4 w-64 rounded bg-elevated" />
      <div className="mt-6 max-w-md space-y-4">
        <div className="h-10 rounded bg-elevated" />
        <div className="h-10 rounded bg-elevated" />
        <div className="h-10 rounded bg-elevated" />
      </div>
    </div>
  )
}
