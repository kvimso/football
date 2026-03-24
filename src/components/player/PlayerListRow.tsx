'use client'

import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import type { PlayerBrowseData } from '@/lib/types'

interface PlayerListRowProps {
  player: PlayerBrowseData
  viewCount?: number
}

export function PlayerListRow({ player }: PlayerListRowProps) {
  const { lang } = useLang()
  const age = calculateAge(player.date_of_birth)
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = player.club ? (lang === 'ka' ? player.club.name_ka : player.club.name) : null
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-primary/20 text-primary'

  return (
    <div
      className="table-row-hover flex items-center gap-3 px-4 py-2 text-sm transition-colors"
      style={{ minHeight: '40px' }}
    >
      {/* Photo — 32px rounded square */}
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-elevated">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.name}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <PlayerSilhouette size="sm" className="scale-75 text-foreground-muted/20" />
        )}
      </div>

      {/* Name */}
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{displayName}</span>

      {/* Position badge */}
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}
      >
        {player.position}
      </span>

      {/* Age */}
      <span className="w-8 text-center text-foreground-muted">{age}</span>

      {/* Club — hidden on mobile */}
      <span className="hidden w-28 truncate text-foreground-muted sm:block">{clubName || '—'}</span>

      {/* Goals */}
      <span className="w-8 text-center font-medium text-foreground-muted">—</span>

      {/* Assists — hidden on mobile */}
      <span className="hidden w-8 text-center font-medium text-foreground-muted sm:block">—</span>

      {/* Matches — hidden below md */}
      <span className="hidden w-8 text-center font-medium text-foreground-muted md:block">—</span>
    </div>
  )
}
