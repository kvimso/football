'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import type { Position, PlayerStatus } from '@/lib/types'

interface PlayerProfileClientProps {
  player: {
    name: string
    name_ka: string
    position: Position
    is_featured: boolean | null
    scouting_report: string | null
    scouting_report_ka: string | null
    club_name: string | null
    club_name_ka: string | null
    club_slug: string | null
    platform_id: string | null
    status: PlayerStatus | null
  }
}

export function PlayerProfileClient({ player }: PlayerProfileClientProps) {
  const { t, lang } = useLang()
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = lang === 'ka' ? player.club_name_ka : player.club_name
  const scoutingReport = lang === 'ka' ? player.scouting_report_ka : player.scouting_report
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-accent/20 text-accent'
  const isFreeAgent = player.status === 'free_agent'

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${posClasses}`}>
          {t(`positions.${player.position}`)}
        </span>
        {isFreeAgent && (
          <span className="rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-semibold text-yellow-400">
            {t('players.freeAgent')}
          </span>
        )}
        {player.is_featured && (
          <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent">
            {t('players.featured')}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-3">
        {clubName && player.club_slug && (
          <Link href={`/clubs/${player.club_slug}`} className="text-sm text-accent hover:underline">
            {clubName}
          </Link>
        )}
        {player.platform_id && (
          <span className="font-mono text-xs text-foreground-muted">{player.platform_id}</span>
        )}
      </div>
      {scoutingReport && (
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{scoutingReport}</p>
      )}
    </>
  )
}
