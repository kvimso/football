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
    <Link href={`/matches/${match.slug}`} className="card group block">
      {/* Competition + date */}
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>{match.competition}</span>
        <span>{format(new Date(match.match_date), 'dd MMM yyyy')}</span>
      </div>

      {/* Score line */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex-1 truncate text-sm font-medium text-foreground">
          {homeName}
        </span>
        <div className="mx-3 flex items-center gap-1.5 rounded-lg bg-background px-3 py-1">
          <span className="text-lg font-bold text-foreground">
            {match.home_score ?? '-'}
          </span>
          <span className="text-foreground-muted">:</span>
          <span className="text-lg font-bold text-foreground">
            {match.away_score ?? '-'}
          </span>
        </div>
        <span className="flex-1 truncate text-right text-sm font-medium text-foreground">
          {awayName}
        </span>
      </div>
    </Link>
  )
}
