import Image from 'next/image'
import Link from 'next/link'
import type { ReferencedPlayer, Position } from '@/lib/types'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'

interface PlayerRefCardProps {
  player: ReferencedPlayer | null
}

export function PlayerRefCard({ player }: PlayerRefCardProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-sm text-foreground-muted">
        <PlayerSilhouette className="h-4 w-4 shrink-0" />
        Player no longer available
      </div>
    )
  }

  const posClass = player.position ? POSITION_COLOR_CLASSES[player.position as Position] : ''

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/60">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated">
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <PlayerSilhouette className="h-6 w-6 text-foreground-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-serif text-[15px] font-semibold text-foreground">
              {player.name}
            </span>
            {player.position && (
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold ${posClass}`}>
                {player.position}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 bg-elevated/40 px-3 py-1.5">
        {player.club ? (
          <Link
            href={`/clubs/${player.club.slug}`}
            className="text-[11px] font-medium text-foreground-muted transition-colors hover:text-primary"
          >
            from {player.club.name}
          </Link>
        ) : (
          <span className="text-[11px] font-medium text-foreground-muted">free agent</span>
        )}
      </div>
    </div>
  )
}

function PlayerSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  )
}
