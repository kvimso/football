'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { POSITION_COLOR_CLASSES, BLUR_DATA_URL } from '@/lib/constants'

interface PlayerCardProps {
  player: {
    slug: string
    name: string
    name_ka: string
    position: string
    date_of_birth: string
    height_cm: number | null
    preferred_foot: string | null
    is_featured: boolean | null
    photo_url: string | null
    status: string
    club: {
      name: string
      name_ka: string
    } | null
    season_stats: {
      goals: number | null
      assists: number | null
      matches_played: number | null
    } | null
  }
}

export function PlayerCard({ player }: PlayerCardProps) {
  const { t, lang } = useLang()
  const age = calculateAge(player.date_of_birth)
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = player.club
    ? lang === 'ka'
      ? player.club.name_ka
      : player.club.name
    : null
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-accent/20 text-accent'
  const isFreeAgent = player.status === 'free_agent'

  return (
    <Link href={`/players/${player.slug}`} className="card group block">
      {/* Photo area */}
      <div className="relative mb-3 flex h-44 items-center justify-center overflow-hidden rounded-lg bg-background">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-foreground-muted/30">
            {player.name.charAt(0)}
          </div>
        )}
        {player.is_featured && (
          <span className="absolute top-2 right-2 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            {t('players.featured')}
          </span>
        )}
        <span
          className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}
        >
          {player.position}
        </span>
      </div>

      {/* Info */}
      <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
        {displayName}
      </h3>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-foreground-muted">
        {isFreeAgent ? (
          <span className="font-medium text-yellow-400">{t('players.freeAgent')}</span>
        ) : clubName ? (
          <span className="truncate">{clubName}</span>
        ) : null}
        {(isFreeAgent || clubName) && <span>·</span>}
        <span>
          {age} {t('players.years')}
        </span>
        {player.preferred_foot && (
          <>
            <span>·</span>
            <span>{player.preferred_foot}</span>
          </>
        )}
      </div>

      {/* Stats row */}
      {player.season_stats && (
        <div className="mt-3 flex gap-4 border-t border-border pt-3 text-xs">
          <div>
            <span className="font-semibold text-foreground">
              {player.season_stats.goals}
            </span>{' '}
            <span className="text-foreground-muted">{t('players.goals')}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              {player.season_stats.assists}
            </span>{' '}
            <span className="text-foreground-muted">{t('players.assists')}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              {player.season_stats.matches_played}
            </span>{' '}
            <span className="text-foreground-muted">{t('players.matches')}</span>
          </div>
        </div>
      )}
    </Link>
  )
}
