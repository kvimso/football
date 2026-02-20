'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { useLang } from '@/hooks/useLang'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { POSITIONS, PREFERRED_FEET, AGE_RANGES } from '@/lib/constants'

interface Club {
  id: string
  name: string
  name_ka: string
}

interface FilterPanelProps {
  clubs: Club[]
}

export function FilterPanel({ clubs }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, lang } = useLang()

  const position = searchParams.get('position') ?? ''
  const age = searchParams.get('age') ?? ''
  const club = searchParams.get('club') ?? ''
  const foot = searchParams.get('foot') ?? ''
  const search = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''

  const [searchInput, setSearchInput] = useState(search)

  const hasFilters = position || age || club || foot || search || status

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/players?${params.toString()}`)
    },
    [router, searchParams]
  )

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParam('q', value)
  }, 400)

  const clearFilters = useCallback(() => {
    setSearchInput('')
    router.push('/players')
  }, [router])

  const selectClasses =
    'rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors'

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <input
        type="text"
        placeholder={t('players.search')}
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value)
          debouncedSearch(e.target.value)
        }}
        className="w-full rounded-lg border border-border bg-background-secondary px-4 py-2.5 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
      />

      {/* Filter row */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        {/* Position */}
        <select
          value={position}
          onChange={(e) => updateParam('position', e.target.value)}
          className={`${selectClasses} w-full sm:w-auto`}
        >
          <option value="">{t('players.allPositions')}</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {t(`positions.${pos}`)}
            </option>
          ))}
        </select>

        {/* Age range */}
        <select
          value={age}
          onChange={(e) => updateParam('age', e.target.value)}
          className={`${selectClasses} w-full sm:w-auto`}
        >
          <option value="">{t('players.allAges')}</option>
          {AGE_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>

        {/* Club */}
        <select
          value={club}
          onChange={(e) => updateParam('club', e.target.value)}
          className={`${selectClasses} w-full sm:w-auto`}
        >
          <option value="">{t('players.allClubs')}</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {lang === 'ka' ? c.name_ka : c.name}
            </option>
          ))}
        </select>

        {/* Preferred foot */}
        <select
          value={foot}
          onChange={(e) => updateParam('foot', e.target.value)}
          className={`${selectClasses} w-full sm:w-auto`}
        >
          <option value="">{t('players.allFeet')}</option>
          {PREFERRED_FEET.map((f) => (
            <option key={f} value={f}>
              {t('foot.' + f)}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          className={`${selectClasses} w-full sm:w-auto`}
        >
          <option value="">{t('players.allStatuses')}</option>
          <option value="active">{t('players.statusActive')}</option>
          <option value="free_agent">{t('players.statusFreeAgent')}</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            {t('players.clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
