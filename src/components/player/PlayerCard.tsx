'use client'

import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import type { PlayerBrowseData } from '@/lib/types'

interface PlayerCardProps {
  player: PlayerBrowseData
  viewCount?: number
}

export function PlayerCard({ player, viewCount }: PlayerCardProps) {
  const { t, lang } = useLang()
  const age = calculateAge(player.date_of_birth)
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = player.club ? (lang === 'ka' ? player.club.name_ka : player.club.name) : null
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-primary/20 text-primary'
  const isFreeAgent = player.status === 'free_agent'
  const isFeatured = player.is_featured

  return (
    <div className="card overflow-hidden">
      {/* Top row: photo + info */}
      <div className="flex gap-3">
        {/* Photo — 56px rounded square */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-elevated">
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <PlayerSilhouette size="sm" className="text-foreground-muted/20" />
          )}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{displayName}</h3>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}
            >
              {player.position}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-muted">
            {isFreeAgent ? (
              <span className="font-medium text-pos-gk shrink-0">{t('players.freeAgent')}</span>
            ) : clubName ? (
              <span className="truncate">{clubName}</span>
            ) : null}
            <span>·</span>
            <span className="shrink-0">{age}</span>
            {player.preferred_foot && (
              <>
                <span>·</span>
                <span>{player.preferred_foot.charAt(0)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Featured badge */}
      {isFeatured && (
        <span className="mt-2 inline-block rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-semibold text-primary">
          {t('players.featured')}
        </span>
      )}
    </div>
  )
}
