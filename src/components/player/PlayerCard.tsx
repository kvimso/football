'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { POSITION_COLOR_CLASSES, BLUR_DATA_URL, POPULAR_VIEWS_THRESHOLD } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'

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
  viewCount?: number
}

export function PlayerCard({ player, viewCount }: PlayerCardProps) {
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
    <Link href={`/players/${player.slug}`} className="card group block overflow-hidden">
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
          <PlayerSilhouette size="md" className="text-foreground-muted/20" />
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
        {viewCount != null && viewCount >= POPULAR_VIEWS_THRESHOLD && (
          <span className="absolute bottom-2 right-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            {t('players.popular')}
          </span>
        )}
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
        {viewCount != null && viewCount > 0 && (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-0.5">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {viewCount}
            </span>
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
