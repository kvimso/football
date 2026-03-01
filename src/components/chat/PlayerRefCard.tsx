import Link from 'next/link'
import Image from 'next/image'
import type { ReferencedPlayer } from '@/lib/types'
import type { Lang } from '@/lib/translations'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import type { Position } from '@/lib/types'

interface PlayerRefCardProps {
  player: ReferencedPlayer | null
  lang: Lang
  t: (key: string) => string
}

export function PlayerRefCard({ player, lang, t }: PlayerRefCardProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary/50 px-3 py-2 text-sm text-foreground-muted">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        {t('chat.playerNotAvailable')}
      </div>
    )
  }

  const displayName = lang === 'ka' && player.name_ka ? player.name_ka : player.name
  const clubName = lang === 'ka' && player.club?.name_ka ? player.club.name_ka : player.club?.name
  const posClass = player.position ? POSITION_COLOR_CLASSES[player.position as Position] : ''

  return (
    <Link
      href={`/players/${player.slug}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-background-secondary/50 px-3 py-2 transition-colors hover:bg-background-secondary"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background-secondary">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={displayName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <svg className="h-5 w-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
          {player.position && (
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${posClass}`}>
              {player.position}
            </span>
          )}
        </div>
        {clubName && (
          <p className="truncate text-xs text-foreground-muted">{clubName}</p>
        )}
      </div>
      <svg className="h-4 w-4 shrink-0 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  )
}
