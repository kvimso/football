'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { RadarChart } from './RadarChart'
import { CompareRadarChart } from './CompareRadarChart'
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
  skills: { pace: number | null; shooting: number | null; passing: number | null; dribbling: number | null; defending: number | null; physical: number | null } | null
  season_stats: { season: string; matches_played: number | null; goals: number | null; assists: number | null; minutes_played: number | null; pass_accuracy: number | null; tackles: number | null; interceptions: number | null } | null
}

interface CompareViewProps {
  allPlayers: { slug: string; name: string; name_ka: string; position: Position }[]
  player1: PlayerData | null
  player2: PlayerData | null
  selectedP1: string
  selectedP2: string
}

export function CompareView({ allPlayers, player1, player2, selectedP1, selectedP2 }: CompareViewProps) {
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

  const radarLabels = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(k => t('skills.' + k))
  const selectClasses = 'w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors'
  const bothSelected = player1 && player2

  return (
    <div>
      {/* Header with title + copy link */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard.compare')}</h1>
        {bothSelected && <CopyLinkButton t={t} />}
      </div>

      {/* Player selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <select value={selectedP1} onChange={(e) => updatePlayer('p1', e.target.value)} className={selectClasses}>
          <option value="">{t('dashboard.selectPlayers')}</option>
          {allPlayers.map((p) => (
            <option key={p.slug} value={p.slug} disabled={p.slug === selectedP2}>
              {lang === 'ka' ? p.name_ka : p.name} ({p.position})
            </option>
          ))}
        </select>
        <select value={selectedP2} onChange={(e) => updatePlayer('p2', e.target.value)} className={selectClasses}>
          <option value="">{t('dashboard.selectPlayers')}</option>
          {allPlayers.map((p) => (
            <option key={p.slug} value={p.slug} disabled={p.slug === selectedP1}>
              {lang === 'ka' ? p.name_ka : p.name} ({p.position})
            </option>
          ))}
        </select>
      </div>

      {bothSelected ? (
        <div className="space-y-6">
          {/* Overlay radar chart */}
          {player1.skills && player2.skills ? (
            <div className="card text-center">
              <h3 className="mb-4 font-semibold text-foreground">{t('compare.skillsComparison')}</h3>
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

          {/* Comparison table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-foreground-muted">
                  <th className="pb-2 text-left">{t('compare.attribute')}</th>
                  <th className="pb-2 text-center">{getName(player1)}</th>
                  <th className="pb-2 text-center">{getName(player2)}</th>
                  <th className="pb-2 text-center">{t('compare.diff')}</th>
                </tr>
              </thead>
              <tbody>
                <CompareRow label={t('compare.position')} v1={player1.position} v2={player2.position} />
                <CompareRow label={t('compare.age')} v1={calculateAge(player1.date_of_birth)} v2={calculateAge(player2.date_of_birth)} showDiff />
                <CompareRow label={t('compare.club')} v1={getClubName(player1)} v2={getClubName(player2)} />
                <CompareRow label={t('compare.height')} v1={player1.height_cm ?? '-'} v2={player2.height_cm ?? '-'} suffix="cm" showDiff />
                <CompareRow label={t('compare.weight')} v1={player1.weight_kg ?? '-'} v2={player2.weight_kg ?? '-'} suffix="kg" showDiff />
                <CompareRow label={t('compare.foot')} v1={player1.preferred_foot ?? '-'} v2={player2.preferred_foot ?? '-'} />

                {/* Skills */}
                {player1.skills && player2.skills && (
                  <>
                    <CompareRow label={t('compare.pace')} v1={player1.skills.pace ?? 0} v2={player2.skills.pace ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.shooting')} v1={player1.skills.shooting ?? 0} v2={player2.skills.shooting ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.passing')} v1={player1.skills.passing ?? 0} v2={player2.skills.passing ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.dribbling')} v1={player1.skills.dribbling ?? 0} v2={player2.skills.dribbling ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.defending')} v1={player1.skills.defending ?? 0} v2={player2.skills.defending ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.physical')} v1={player1.skills.physical ?? 0} v2={player2.skills.physical ?? 0} highlight showDiff />
                  </>
                )}

                {/* Season stats */}
                {player1.season_stats && player2.season_stats && (
                  <>
                    <CompareRow label={t('compare.matches')} v1={player1.season_stats.matches_played ?? 0} v2={player2.season_stats.matches_played ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.goals')} v1={player1.season_stats.goals ?? 0} v2={player2.season_stats.goals ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.assists')} v1={player1.season_stats.assists ?? 0} v2={player2.season_stats.assists ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.minutes')} v1={player1.season_stats.minutes_played ?? 0} v2={player2.season_stats.minutes_played ?? 0} highlight showDiff />
                    <CompareRow label={t('compare.passPercent')} v1={player1.season_stats.pass_accuracy ?? '-'} v2={player2.season_stats.pass_accuracy ?? '-'} suffix="%" highlight showDiff />
                    <CompareRow label={t('compare.tackles')} v1={player1.season_stats.tackles ?? 0} v2={player2.season_stats.tackles ?? 0} highlight showDiff />
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl text-foreground-muted/30 mb-4">&#8644;</div>
          <p className="text-lg font-medium text-foreground-muted">{t('dashboard.selectPlayers')}</p>
        </div>
      )}
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
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground hover:border-accent/50 transition-colors"
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {t('compare.copied')}
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.52" />
          </svg>
          {t('compare.copyLink')}
        </>
      )}
    </button>
  )
}

function CompareRow({ label, v1, v2, highlight = false, showDiff = false, suffix = '' }: {
  label: string
  v1: string | number
  v2: string | number
  highlight?: boolean
  showDiff?: boolean
  suffix?: string
}) {
  const n1 = typeof v1 === 'number' ? v1 : NaN
  const n2 = typeof v2 === 'number' ? v2 : NaN

  let c1 = 'text-foreground'
  let c2 = 'text-foreground'

  if (highlight && !isNaN(n1) && !isNaN(n2) && n1 !== n2) {
    c1 = n1 > n2 ? 'text-accent font-semibold' : 'text-foreground-muted'
    c2 = n2 > n1 ? 'text-accent font-semibold' : 'text-foreground-muted'
  }

  // Display values with suffix
  const display1 = typeof v1 === 'number' ? `${v1}${suffix}` : v1
  const display2 = typeof v2 === 'number' ? `${v2}${suffix}` : v2

  // Diff cell
  let diffContent: React.ReactNode = null
  if (showDiff && !isNaN(n1) && !isNaN(n2)) {
    const diff = n1 - n2
    if (diff > 0) {
      diffContent = <span className="text-accent font-medium">+{diff}</span>
    } else if (diff < 0) {
      diffContent = <span className="text-red-400 font-medium">{diff}</span>
    } else {
      diffContent = <span className="text-foreground-muted">0</span>
    }
  }

  return (
    <tr className="border-b border-border/50">
      <td className="py-2 text-foreground-muted">{label}</td>
      <td className={`py-2 text-center ${c1}`}>{display1}</td>
      <td className={`py-2 text-center ${c2}`}>{display2}</td>
      <td className="py-2 text-center text-xs">{diffContent}</td>
    </tr>
  )
}
