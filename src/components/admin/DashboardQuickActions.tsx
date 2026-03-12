import Link from 'next/link'

interface DashboardQuickActionsProps {
  labels: {
    quickActions: string
    addPlayer: string
    messages: string
    players: string
    transfers: string
  }
  unreadCount: number
}

export function DashboardQuickActions({ labels, unreadCount }: DashboardQuickActionsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
        {labels.quickActions}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/admin/players/new"
          className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-background-secondary"
        >
          <svg
            className="h-4.5 w-4.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
            />
          </svg>
          {labels.addPlayer}
        </Link>
        <Link
          href="/admin/messages"
          className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-background-secondary"
        >
          <svg
            className="h-4.5 w-4.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
            />
          </svg>
          {labels.messages}
          {unreadCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-background">
              {unreadCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/players"
          className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-background-secondary"
        >
          <svg
            className="h-4.5 w-4.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {labels.players}
        </Link>
        <Link
          href="/admin/transfers"
          className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-background-secondary"
        >
          <svg
            className="h-4.5 w-4.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
          {labels.transfers}
        </Link>
      </div>
    </div>
  )
}
