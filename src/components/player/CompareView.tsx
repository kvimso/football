'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { RadarChart } from './RadarChart'
import { CompareRadarChart } from './CompareRadarChart'
import { PlayerSearchSelect } from './PlayerSearchSelect'
import type { Position } from '@/lib/types'

interface PlayerData {
  name: string
  name_ka: string
  slug: string
  position: Position
  date_of_birth: string
  height_cm: number | null
  weight_kg: number | null
  preferred_foot: string | null
  jersey_number: number | null
  club: { name: string; name_ka: string } | null
  skills: {
    pace: number | null
    shooting: number | null
    passing: number | null
    dribbling: number | null
    defending: number | null
    physical: number | null
  } | null
  season_stats: {
    season: string
    matches_played: number | null
    goals: number | null
    assists: number | null
    minutes_played: number | null
    pass_accuracy: number | null
    tackles: number | null
    interceptions: number | null
  } | null
}

interface CompareViewProps {
  player1: PlayerData | null
  player2: PlayerData | null
  selectedP1: string
  selectedP2: string
}

export function CompareView({ player1, player2, selectedP1, selectedP2 }: CompareViewProps) {
  const router = useRouter()
  const { t, lang } = useLang()

  function updatePlayer(which: 'p1' | 'p2', slug: string) {
    const params = new URLSearchParams()
    if (which === 'p1') {
      if (slug) params.set('p1', slug)
      if (selectedP2) params.set('p2', selectedP2)
    } else {
      if (selectedP1) params.set('p1', selectedP1)
      if (slug) params.set('p2', slug)
    }
    router.push(`/players/compare?${params.toString()}`)
  }

  function getName(p: PlayerData) {
    return lang === 'ka' ? p.name_ka : p.name
  }

  function getClubName(p: PlayerData) {
    return p.club ? (lang === 'ka' ? p.club.name_ka : p.club.name) : '-'
  }

  const radarLabels = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(
    (k) => t('skills.' + k)
  )
  const bothSelected = player1 && player2

  const p1Label = player1
    ? `${lang === 'ka' ? player1.name_ka : player1.name} (${player1.position})`
    : ''
  const p2Label = player2
    ? `${lang === 'ka' ? player2.name_ka : player2.name} (${player2.position})`
    : ''

  return (
    <div>
      {/* Header with title + copy link */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard.compare')}</h1>
        {bothSelected && <CopyLinkButton t={t} />}
      </div>

      {/* Player selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <PlayerSearchSelect
          value={selectedP1}
          disabledSlug={selectedP2}
          onSelect={(slug) => updatePlayer('p1', slug)}
          selectedLabel={p1Label}
        />
        <PlayerSearchSelect
          value={selectedP2}
          disabledSlug={selectedP1}
          onSelect={(slug) => updatePlayer('p2', slug)}
          selectedLabel={p2Label}
        />
      </div>

      {bothSelected ? (
        <div className="space-y-6">
          {/* Overlay radar chart */}
          {player1.skills && player2.skills ? (
            <div className="card text-center">
              <h3 className="mb-4 font-semibold text-foreground">
                {t('compare.skillsComparison')}
              </h3>
              <CompareRadarChart
                skills1={player1.skills}
                skills2={player2.skills}
                labels={radarLabels}
                player1Name={getName(player1)}
                player2Name={getName(player2)}
              />
            </div>
          ) : player1.skills ? (
            <div className="card text-center">
              <h3 className="mb-2 font-semibold text-foreground">{getName(player1)}</h3>
              <RadarChart skills={player1.skills} labels={radarLabels} />
            </div>
          ) : player2.skills ? (
            <div className="card text-center">
              <h3 className="mb-2 font-semibold text-foreground">{getName(player2)}</h3>
              <RadarChart skills={player2.skills} labels={radarLabels} />
            </div>
          ) : null}

          {/* Comparison with center-growing bars */}
          <div className="card">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-4 text-sm font-semibold">
              <div className="text-left text-primary truncate">{getName(player1)}</div>
              <div className="w-24 sm:w-32 text-center text-foreground-muted text-xs">vs</div>
              <div className="text-right text-[var(--pos-def)] truncate">{getName(player2)}</div>
            </div>

            {/* Info rows (text only, no bars) */}
            <div className="space-y-2 mb-6">
              <InfoRow label={t('compare.position')} v1={player1.position} v2={player2.position} />
              <InfoRow
                label={t('compare.age')}
                v1={String(calculateAge(player1.date_of_birth))}
                v2={String(calculateAge(player2.date_of_birth))}
              />
              <InfoRow
                label={t('compare.club')}
                v1={getClubName(player1)}
                v2={getClubName(player2)}
              />
              <InfoRow
                label={t('compare.height')}
                v1={player1.height_cm ? `${player1.height_cm}cm` : '-'}
                v2={player2.height_cm ? `${player2.height_cm}cm` : '-'}
              />
              <InfoRow
                label={t('compare.weight')}
                v1={player1.weight_kg ? `${player1.weight_kg}kg` : '-'}
                v2={player2.weight_kg ? `${player2.weight_kg}kg` : '-'}
              />
              <InfoRow
                label={t('compare.foot')}
                v1={player1.preferred_foot ?? '-'}
                v2={player2.preferred_foot ?? '-'}
              />
            </div>

            {/* Skills bars */}
            {player1.skills && player2.skills && (
              <div className="space-y-3 mb-6">
                <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                  {t('players.skills')}
                </div>
                <CompareBar
                  label={t('compare.pace')}
                  v1={player1.skills.pace}
                  v2={player2.skills.pace}
                  max={100}
                />
                <CompareBar
                  label={t('compare.shooting')}
                  v1={player1.skills.shooting}
                  v2={player2.skills.shooting}
                  max={100}
                />
                <CompareBar
                  label={t('compare.passing')}
                  v1={player1.skills.passing}
                  v2={player2.skills.passing}
                  max={100}
                />
                <CompareBar
                  label={t('compare.dribbling')}
                  v1={player1.skills.dribbling}
                  v2={player2.skills.dribbling}
                  max={100}
                />
                <CompareBar
                  label={t('compare.defending')}
                  v1={player1.skills.defending}
                  v2={player2.skills.defending}
                  max={100}
                />
                <CompareBar
                  label={t('compare.physical')}
                  v1={player1.skills.physical}
                  v2={player2.skills.physical}
                  max={100}
                />
              </div>
            )}

            {/* Season stats bars */}
            {player1.season_stats && player2.season_stats && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                  {t('players.seasonStats')}
                </div>
                <CompareBar
                  label={t('compare.matches')}
                  v1={player1.season_stats.matches_played}
                  v2={player2.season_stats.matches_played}
                />
                <CompareBar
                  label={t('compare.goals')}
                  v1={player1.season_stats.goals}
                  v2={player2.season_stats.goals}
                />
                <CompareBar
                  label={t('compare.assists')}
                  v1={player1.season_stats.assists}
                  v2={player2.season_stats.assists}
                />
                <CompareBar
                  label={t('compare.minutes')}
                  v1={player1.season_stats.minutes_played}
                  v2={player2.season_stats.minutes_played}
                />
                <CompareBar
                  label={t('compare.passPercent')}
                  v1={player1.season_stats.pass_accuracy}
                  v2={player2.season_stats.pass_accuracy}
                  suffix="%"
                  max={100}
                />
                <CompareBar
                  label={t('compare.tackles')}
                  v1={player1.season_stats.tackles}
                  v2={player2.season_stats.tackles}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl text-foreground-muted/30 mb-4">&#8644;</div>
          <p className="text-lg font-medium text-foreground-muted">
            {t('dashboard.selectPlayers')}
          </p>
        </div>
      )}
    </div>
  )
}

/** Simple text row for non-numeric info (position, club, foot) */
function InfoRow({ label, v1, v2 }: { label: string; v1: string; v2: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-sm">
      <div className="text-right text-foreground">{v1}</div>
      <div className="w-24 sm:w-32 text-center text-xs text-foreground-muted">{label}</div>
      <div className="text-left text-foreground">{v2}</div>
    </div>
  )
}

/** Center-growing comparison bar — FotMob/SofaScore style */
function CompareBar({
  label,
  v1,
  v2,
  max,
  suffix = '',
}: {
  label: string
  v1: number | null
  v2: number | null
  max?: number
  suffix?: string
}) {
  const n1 = v1 ?? 0
  const n2 = v2 ?? 0
  const isNull1 = v1 == null
  const isNull2 = v2 == null

  // For bars without explicit max, use the larger value as reference
  const reference = max ?? Math.max(n1, n2, 1)
  const pct1 = (n1 / reference) * 100
  const pct2 = (n2 / reference) * 100

  // Determine winner for coloring
  const winner = n1 > n2 ? 1 : n2 > n1 ? 2 : 0
  const bothZero = n1 === 0 && n2 === 0

  // Colors: winner = green, loser = muted gray, equal = both neutral
  const color1 = bothZero
    ? 'transparent'
    : winner === 1
      ? '#10b981'
      : winner === 0
        ? 'var(--foreground-muted)'
        : 'rgba(152, 150, 163, 0.3)'
  const color2 = bothZero
    ? 'transparent'
    : winner === 2
      ? '#10b981'
      : winner === 0
        ? 'var(--foreground-muted)'
        : 'rgba(152, 150, 163, 0.3)'

  const textColor1 = winner === 1 ? 'text-emerald-500 font-semibold' : 'text-foreground'
  const textColor2 = winner === 2 ? 'text-emerald-500 font-semibold' : 'text-foreground'

  return (
    <div>
      {/* Label centered above */}
      <div className="text-center text-xs text-foreground-muted mb-1">{label}</div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        {/* P1 value + bar (right-aligned, growing left) */}
        <div className="flex items-center gap-2">
          <span className={`shrink-0 text-sm tabular-nums ${textColor1}`}>
            {isNull1 ? '—' : `${n1}${suffix}`}
          </span>
          <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden relative">
            {!bothZero && !isNull1 && (
              <div
                className="absolute inset-y-0 right-0 rounded-full transition-all duration-500"
                style={{ width: `${pct1}%`, backgroundColor: color1 }}
              />
            )}
          </div>
        </div>

        {/* Center divider */}
        <div className="w-px h-4 bg-border" />

        {/* P2 bar + value (left-aligned, growing right) */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden relative">
            {!bothZero && !isNull2 && (
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ width: `${pct2}%`, backgroundColor: color2 }}
              />
            )}
          </div>
          <span className={`shrink-0 text-sm tabular-nums ${textColor2}`}>
            {isNull2 ? '—' : `${n2}${suffix}`}
          </span>
        </div>
      </div>
    </div>
  )
}

function CopyLinkButton({ t }: { t: (key: string) => string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground hover:border-primary/50 transition-colors"
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {t('compare.copied')}
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.52"
            />
          </svg>
          {t('compare.copyLink')}
        </>
      )}
    </button>
  )
}
