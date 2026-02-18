'use client'

import { useLang } from '@/hooks/useLang'

type MatchDetailClientProps =
  | { type: 'home_club' | 'away_club'; name: string; name_ka: string }
  | { type: 'report'; report: string | null; report_ka: string | null }

export function MatchDetailClient(props: MatchDetailClientProps) {
  const { lang, t } = useLang()

  if (props.type === 'report') {
    const text = lang === 'ka' ? props.report_ka : props.report
    if (!text) return null
    return (
      <div className="mt-6 card">
        <h3 className="mb-3 text-lg font-semibold text-foreground">{t('matches.matchReport')}</h3>
        <p className="text-sm leading-relaxed text-foreground-muted">{text}</p>
      </div>
    )
  }

  const displayName = lang === 'ka' ? props.name_ka : props.name
  return <>{displayName}</>
}
