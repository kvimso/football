'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { RadarChart } from './RadarChart'

interface PlayerData {
  name: string
  name_ka: string
  slug: string
  position: string
  date_of_birth: string
  height_cm: number | null
  weight_kg: number | null
  preferred_foot: string | null
  jersey_number: number | null
  club: { name: string; name_ka: string } | null
  skills: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number } | null
  season_stats: { season: string; matches_played: number; goals: number; assists: number; minutes_played: number; pass_accuracy: number | null; tackles: number; interceptions: number } | null
}

interface CompareViewProps {
  allPlayers: { slug: string; name: string; name_ka: string; position: string }[]
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

  const selectClasses = 'w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors'

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('dashboard.compare')}</h1>

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

      {player1 && player2 ? (
        <div className="space-y-6">
          {/* Radar charts side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {player1.skills && (
              <div className="card text-center">
                <h3 className="mb-2 font-semibold text-foreground">{getName(player1)}</h3>
                <RadarChart skills={player1.skills} />
              </div>
            )}
            {player2.skills && (
              <div className="card text-center">
                <h3 className="mb-2 font-semibold text-foreground">{getName(player2)}</h3>
                <RadarChart skills={player2.skills} />
              </div>
            )}
          </div>

          {/* Comparison table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-foreground-muted">
                  <th className="pb-2 text-left">{t('compare.attribute')}</th>
                  <th className="pb-2 text-center">{getName(player1)}</th>
                  <th className="pb-2 text-center">{getName(player2)}</th>
                </tr>
              </thead>
              <tbody>
                <CompareRow label={t('compare.position')} v1={player1.position} v2={player2.position} />
                <CompareRow label={t('compare.age')} v1={calculateAge(player1.date_of_birth)} v2={calculateAge(player2.date_of_birth)} />
                <CompareRow label={t('compare.club')} v1={getClubName(player1)} v2={getClubName(player2)} />
                <CompareRow label={t('compare.height')} v1={player1.height_cm ? `${player1.height_cm}cm` : '-'} v2={player2.height_cm ? `${player2.height_cm}cm` : '-'} />
                <CompareRow label={t('compare.weight')} v1={player1.weight_kg ? `${player1.weight_kg}kg` : '-'} v2={player2.weight_kg ? `${player2.weight_kg}kg` : '-'} />
                <CompareRow label={t('compare.foot')} v1={player1.preferred_foot ?? '-'} v2={player2.preferred_foot ?? '-'} />

                {/* Skills */}
                {player1.skills && player2.skills && (
                  <>
                    <CompareRow label={t('compare.pace')} v1={player1.skills.pace} v2={player2.skills.pace} highlight />
                    <CompareRow label={t('compare.shooting')} v1={player1.skills.shooting} v2={player2.skills.shooting} highlight />
                    <CompareRow label={t('compare.passing')} v1={player1.skills.passing} v2={player2.skills.passing} highlight />
                    <CompareRow label={t('compare.dribbling')} v1={player1.skills.dribbling} v2={player2.skills.dribbling} highlight />
                    <CompareRow label={t('compare.defending')} v1={player1.skills.defending} v2={player2.skills.defending} highlight />
                    <CompareRow label={t('compare.physical')} v1={player1.skills.physical} v2={player2.skills.physical} highlight />
                  </>
                )}

                {/* Season stats */}
                {player1.season_stats && player2.season_stats && (
                  <>
                    <CompareRow label={t('compare.matches')} v1={player1.season_stats.matches_played} v2={player2.season_stats.matches_played} highlight />
                    <CompareRow label={t('compare.goals')} v1={player1.season_stats.goals} v2={player2.season_stats.goals} highlight />
                    <CompareRow label={t('compare.assists')} v1={player1.season_stats.assists} v2={player2.season_stats.assists} highlight />
                    <CompareRow label={t('compare.minutes')} v1={player1.season_stats.minutes_played} v2={player2.season_stats.minutes_played} highlight />
                    <CompareRow label={t('compare.passPercent')} v1={player1.season_stats.pass_accuracy ? `${player1.season_stats.pass_accuracy}%` : '-'} v2={player2.season_stats.pass_accuracy ? `${player2.season_stats.pass_accuracy}%` : '-'} />
                    <CompareRow label={t('compare.tackles')} v1={player1.season_stats.tackles} v2={player2.season_stats.tackles} highlight />
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

function CompareRow({ label, v1, v2, highlight = false }: { label: string; v1: string | number; v2: string | number; highlight?: boolean }) {
  const n1 = typeof v1 === 'number' ? v1 : NaN
  const n2 = typeof v2 === 'number' ? v2 : NaN

  let c1 = 'text-foreground'
  let c2 = 'text-foreground'

  if (highlight && !isNaN(n1) && !isNaN(n2) && n1 !== n2) {
    c1 = n1 > n2 ? 'text-accent font-semibold' : 'text-foreground-muted'
    c2 = n2 > n1 ? 'text-accent font-semibold' : 'text-foreground-muted'
  }

  return (
    <tr className="border-b border-border/50">
      <td className="py-2 text-foreground-muted">{label}</td>
      <td className={`py-2 text-center ${c1}`}>{v1}</td>
      <td className={`py-2 text-center ${c2}`}>{v2}</td>
    </tr>
  )
}
