import Link from 'next/link'
import type { Database } from '@/lib/database.types'

type MatchPlayerStatsRow = Database['public']['Tables']['match_player_stats']['Row']

// IMPORTANT: These columns must match the select string in the Supabase query.
// Pick<> validates column names against the schema, but does NOT verify they are fetched.
type MatchStatDetailStats = Pick<
  MatchPlayerStatsRow,
  | 'minutes_played'
  | 'goals'
  | 'assists'
  | 'key_passes'
  | 'shots'
  | 'shots_on_target'
  | 'tackles'
  | 'interceptions'
  | 'distance_m'
  | 'sprints_count'
  | 'speed_avg'
  | 'passes_total'
  | 'passes_successful'
  | 'pass_success_rate'
  | 'dribbles_success'
  | 'dribbles_fail'
  | 'overall_rating'
>

interface MatchStatDetailProps {
  stats: MatchStatDetailStats
  matchSlug: string | null
  t: (key: string) => string
}

function StatRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value ?? '—'}</span>
    </div>
  )
}

export function MatchStatDetail({ stats, matchSlug, t }: MatchStatDetailProps) {
  const dribbleTotal = (stats.dribbles_success ?? 0) + (stats.dribbles_fail ?? 0)
  const dribblePercent =
    dribbleTotal > 0 ? Math.round(((stats.dribbles_success ?? 0) / dribbleTotal) * 100) : null
  const distanceKm =
    stats.distance_m != null ? `${Math.round(stats.distance_m / 100) / 10}km` : null

  return (
    <div className="border-t border-border px-4 py-3">
      {matchSlug && (
        <div className="mb-3">
          <Link href={`/matches/${matchSlug}`} className="text-xs text-primary hover:underline">
            {t('stats.match')} &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {/* Attacking */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-3.5 w-3.5 text-pos-att"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
            <span className="text-xs font-semibold text-foreground">{t('players.attacking')}</span>
          </div>
          <StatRow label={t('players.goals')} value={stats.goals} />
          <StatRow label={t('players.assists')} value={stats.assists} />
          <StatRow label={t('stats.keyPasses')} value={stats.key_passes} />
          <StatRow label={t('stats.shots')} value={stats.shots} />
          <StatRow label={t('stats.shotsOnTarget')} value={stats.shots_on_target} />
          <StatRow
            label={t('stats.dribblesSuccess')}
            value={
              stats.dribbles_success != null || stats.dribbles_fail != null
                ? `${stats.dribbles_success ?? 0}/${dribbleTotal}${dribblePercent != null ? ` (${dribblePercent}%)` : ''}`
                : null
            }
          />
        </div>

        {/* Passing */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-3.5 w-3.5 text-pos-mid"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
            <span className="text-xs font-semibold text-foreground">
              {t('players.passingCategory')}
            </span>
          </div>
          <StatRow label={t('stats.passesTotal')} value={stats.passes_total} />
          <StatRow label={t('stats.passesSuccessful')} value={stats.passes_successful} />
          <StatRow
            label={t('stats.passPercent')}
            value={stats.pass_success_rate != null ? `${stats.pass_success_rate}%` : null}
          />
        </div>

        {/* Defending */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-3.5 w-3.5 text-pos-def"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <span className="text-xs font-semibold text-foreground">{t('players.defensive')}</span>
          </div>
          <StatRow label={t('stats.tackles')} value={stats.tackles} />
          <StatRow label={t('stats.int')} value={stats.interceptions} />
        </div>

        {/* Physical */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-3.5 w-3.5 text-pos-wng"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
              />
            </svg>
            <span className="text-xs font-semibold text-foreground">
              {t('players.physicalCategory')}
            </span>
          </div>
          <StatRow label={t('stats.min')} value={stats.minutes_played} />
          <StatRow label={t('stats.dist')} value={distanceKm} />
          <StatRow label={t('stats.speed')} value={stats.sprints_count} />
          <StatRow
            label={t('stats.speedAvg')}
            value={stats.speed_avg != null ? `${stats.speed_avg} km/h` : null}
          />
        </div>
      </div>
    </div>
  )
}
