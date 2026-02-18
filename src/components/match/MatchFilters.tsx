'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/hooks/useLang'

interface MatchFiltersProps {
  competitions: string[]
}

export function MatchFilters({ competitions }: MatchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLang()
  const current = searchParams.get('competition') ?? ''

  function updateCompetition(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('competition', value)
    } else {
      params.delete('competition')
    }
    router.push(`/matches?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={current}
        onChange={(e) => updateCompetition(e.target.value)}
        className="rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors"
      >
        <option value="">{t('matches.allCompetitions')}</option>
        {competitions.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  )
}
