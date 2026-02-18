'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'

interface PlayerProfileClientProps {
  player: {
    name: string
    name_ka: string
    position: string
    is_featured: boolean
    scouting_report: string | null
    scouting_report_ka: string | null
    club_name: string | null
    club_name_ka: string | null
    club_slug: string | null
  }
}

export function PlayerProfileClient({ player }: PlayerProfileClientProps) {
  const { t, lang } = useLang()
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = lang === 'ka' ? player.club_name_ka : player.club_name
  const scoutingReport = lang === 'ka' ? player.scouting_report_ka : player.scouting_report
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-accent/20 text-accent'

  return (
    <>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${posClasses}`}>
          {t(`positions.${player.position}`)}
        </span>
        {player.is_featured && (
          <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent">
            {t('players.featured')}
          </span>
        )}
      </div>
      {clubName && player.club_slug && (
        <Link href={`/clubs/${player.club_slug}`} className="mt-1 inline-block text-sm text-accent hover:underline">
          {clubName}
        </Link>
      )}
      {scoutingReport && (
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{scoutingReport}</p>
      )}
    </>
  )
}
