'use client'

import { useState, useEffect, useRef } from 'react'
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
    overall: number | null
    attack: number | null
    defence: number | null
    fitness: number | null
    dribbling: number | null
    shooting: number | null
    possession: number | null
    tackling: number | null
    positioning: number | null
    matches_counted: number | null
  } | null
}

type SkillKey = keyof Omit<NonNullable<PlayerData['skills']>, 'matches_counted'>

const SKILL_KEYS: SkillKey[] = [
  'overall',
  'attack',
  'defence',
  'fitness',
  'dribbling',
  'shooting',
  'possession',
  'tackling',
  'positioning',
]

interface CompareViewProps {
  player1: PlayerData | null
  player2: PlayerData | null
  selectedP1: string
  selectedP2: string
}

export function CompareView({ player1, player2, selectedP1, selectedP2 }: CompareViewProps) {
  const router = useRouter()
  const { t, lang } = useLang()

  // Local pending state to avoid stale reads during rapid selection
  const [pendingP1, setPendingP1] = useState(selectedP1)
  const [pendingP2, setPendingP2] = useState(selectedP2)

  useEffect(() => {
    setPendingP1(selectedP1)
  }, [selectedP1])
  useEffect(() => {
    setPendingP2(selectedP2)
  }, [selectedP2])

  function updatePlayer(which: 'p1' | 'p2', slug: string) {
    const s1 = which === 'p1' ? slug : pendingP1
    const s2 = which === 'p2' ? slug : pendingP2
    if (which === 'p1') setPendingP1(slug)
    else setPendingP2(slug)
    const params = new URLSearchParams()
    if (s1) params.set('p1', s1)
    if (s2) params.set('p2', s2)
    router.push(`/players/compare?${params.toString()}`)
  }

  function getName(p: PlayerData) {
    return lang === 'ka' ? p.name_ka : p.name
  }

  function getClubName(p: PlayerData) {
    return p.club ? (lang === 'ka' ? p.club.name_ka : p.club.name) : '-'
  }

  // 6 skills for the radar chart (attack, defence, fitness, dribbling, shooting, possession)
  const RADAR_KEYS: SkillKey[] = [
    'attack',
    'defence',
    'fitness',
    'dribbling',
    'shooting',
    'possession',
  ]
  const radarLabels = RADAR_KEYS.map((k) => t('skills.' + k))
  const bothSelected = player1 && player2

  const p1Label = player1 ? `${getName(player1)} (${player1.position})` : ''
  const p2Label = player2 ? `${getName(player2)} (${player2.position})` : ''

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
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Quick verdict */}
          <QuickVerdict player1={player1} player2={player2} getName={getName} t={t} />

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
              <div className="text-right text-[var(--pos-gk)] truncate">{getName(player2)}</div>
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

            {/* Skills bars (camera 1-10 scale) */}
            {player1.skills && player2.skills && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                  {t('players.skills')}
                </div>
                {SKILL_KEYS.map((key) => (
                  <CompareBar
                    key={key}
                    label={t(`skills.${key}`)}
                    v1={player1.skills![key]}
                    v2={player2.skills![key]}
                    max={10}
                  />
                ))}
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

/** Quick verdict — "Player A leads in 7 of 12 comparable stats" */
function QuickVerdict({
  player1,
  player2,
  getName,
  t,
}: {
  player1: PlayerData
  player2: PlayerData
  getName: (p: PlayerData) => string
  t: (key: string) => string
}) {
  let p1Wins = 0,
    p2Wins = 0,
    totalCompared = 0

  for (const key of SKILL_KEYS) {
    const v1 = player1.skills?.[key] ?? null
    const v2 = player2.skills?.[key] ?? null
    if (v1 != null && v2 != null) {
      totalCompared++
      if (v1 > v2) p1Wins++
      else if (v2 > v1) p2Wins++
    }
  }

  if (totalCompared === 0) return null

  const leader = p1Wins > p2Wins ? getName(player1) : p2Wins > p1Wins ? getName(player2) : null
  const leadCount = Math.max(p1Wins, p2Wins)

  const leadsText = t('compare.leadsIn')
    .replace('{count}', String(leadCount))
    .replace('{total}', String(totalCompared))

  return (
    <div className="rounded-lg bg-surface border border-border px-4 py-3 text-center text-sm">
      {leader ? (
        <span>
          <span className="font-semibold text-primary">{leader}</span>{' '}
          <span className="text-foreground-muted">{leadsText}</span>
        </span>
      ) : (
        <span className="text-foreground-muted">{t('compare.evenMatch')}</span>
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

/** Center-growing comparison bar with stat diffs — theme-aware */
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

  const reference = max ?? Math.max(n1, n2, 1)
  const pct1 = (n1 / reference) * 100
  const pct2 = (n2 / reference) * 100
  const diff = Math.abs(n1 - n2)
  const winner = n1 > n2 ? 1 : n2 > n1 ? 2 : 0
  const hasDiff = diff > 0 && v1 != null && v2 != null

  const winnerColor = 'var(--primary)'
  const loserColor = 'var(--foreground-muted)'

  const color1 = winner === 1 ? winnerColor : loserColor
  const color2 = winner === 2 ? winnerColor : loserColor
  const textColor1 = winner === 1 ? 'text-primary font-semibold' : 'text-foreground'
  const textColor2 = winner === 2 ? 'text-primary font-semibold' : 'text-foreground'
  const diffText = hasDiff ? (suffix === '%' ? `+${diff.toFixed(1)}` : `+${diff}`) : ''

  return (
    <div aria-label={`${label}: ${n1}${suffix} vs ${n2}${suffix}`}>
      <div className="text-center text-xs text-foreground-muted mb-1">{label}</div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        {/* P1 side */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-10 shrink-0 text-[10px] tabular-nums text-primary text-left"
            aria-hidden="true"
          >
            {winner === 1 ? diffText : ''}
          </span>
          <span className={`shrink-0 text-sm tabular-nums ${textColor1}`}>
            {v1 == null ? '\u2014' : `${n1}${suffix}`}
          </span>
          <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden relative">
            {v1 != null && n1 > 0 && (
              <div
                className="absolute inset-y-0 right-0 rounded-full transition-[width] duration-150"
                style={{ width: `${pct1}%`, backgroundColor: color1 }}
              />
            )}
          </div>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* P2 side */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden relative">
            {v2 != null && n2 > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150"
                style={{ width: `${pct2}%`, backgroundColor: color2 }}
              />
            )}
          </div>
          <span className={`shrink-0 text-sm tabular-nums ${textColor2}`}>
            {v2 == null ? '\u2014' : `${n2}${suffix}`}
          </span>
          <span
            className="w-10 shrink-0 text-[10px] tabular-nums text-primary text-right"
            aria-hidden="true"
          >
            {winner === 2 ? diffText : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function CopyLinkButton({ t }: { t: (key: string) => string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    []
  )

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
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
