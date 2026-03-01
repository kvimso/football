'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { format } from 'date-fns'

interface MatchCardProps {
  match: {
    slug: string
    home_score: number | null
    away_score: number | null
    competition: string | null
    match_date: string
    home_club: { name: string; name_ka: string } | null
    away_club: { name: string; name_ka: string } | null
  }
}

export function MatchCard({ match }: MatchCardProps) {
  const { t, lang } = useLang()

  const homeName = match.home_club
    ? lang === 'ka' ? match.home_club.name_ka : match.home_club.name
    : t('matches.tbd')
  const awayName = match.away_club
    ? lang === 'ka' ? match.away_club.name_ka : match.away_club.name
    : t('matches.tbd')

  return (
    <Link href={`/matches/${match.slug}`} className="card group block overflow-hidden">
      {/* Competition + date header bar */}
      <div className="-mx-5 -mt-5 mb-4 flex items-center justify-between border-b border-border bg-background/50 px-5 py-2.5 text-xs text-foreground-muted">
        <span className="font-medium">{match.competition}</span>
        <span>{format(new Date(match.match_date), 'dd MMM yyyy')}</span>
      </div>

      {/* Score line */}
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 truncate text-sm font-semibold text-foreground text-left">
          {homeName}
        </span>
        <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-1.5">
          <span className="text-xl font-extrabold text-foreground tabular-nums">
            {match.home_score ?? '-'}
          </span>
          <span className="text-foreground-muted font-light">:</span>
          <span className="text-xl font-extrabold text-foreground tabular-nums">
            {match.away_score ?? '-'}
          </span>
        </div>
        <span className="flex-1 truncate text-right text-sm font-semibold text-foreground">
          {awayName}
        </span>
      </div>
    </Link>
  )
}
