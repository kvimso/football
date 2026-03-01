import { formatDistanceToNow } from 'date-fns'

interface ScoutActivityItem {
  id: string
  viewed_at: string | null
  viewer: { full_name: string | null; organization: string | null; role: string | null } | null
  player: { name: string | null; name_ka: string | null } | null
}

export function DashboardScoutActivity({
  title,
  noActivityLabel,
  viewedLabel,
  unknownLabel,
  activity,
}: {
  title: string
  noActivityLabel: string
  viewedLabel: string
  unknownLabel: string
  activity: ScoutActivityItem[]
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">{title}</h2>
      {activity.length > 0 ? (
        <div className="mt-4 space-y-2">
          {activity.map((view) => (
            <div key={view.id} className="flex items-center gap-3 rounded-lg bg-background px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">
                    {view.viewer?.full_name ?? (view.viewer?.organization ? view.viewer.organization : unknownLabel)}
                  </span>
                  {view.viewer?.full_name && view.viewer?.organization && (
                    <span className="text-foreground-muted"> ({view.viewer.organization})</span>
                  )}
                  {' '}{viewedLabel}{' '}
                  <span className="font-medium">{view.player?.name ?? ''}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs text-foreground-muted/70">
                {view.viewed_at ? formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true }) : ''}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-background py-10 text-center">
          <svg className="h-12 w-12 text-foreground-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-foreground-muted">{noActivityLabel}</p>
          <p className="mt-1 text-xs text-foreground-muted/60">{noActivityLabel}</p>
        </div>
      )}
    </div>
  )
}
