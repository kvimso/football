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

const POSITION_CHIP_COLORS: Record<string, string> = {
  GK: 'bg-pos-gk text-white border-pos-gk',
  DEF: 'bg-pos-def text-white border-pos-def',
  MID: 'bg-pos-mid text-white border-pos-mid',
  ATT: 'bg-pos-att text-white border-pos-att',
  WNG: 'bg-pos-wng text-white border-pos-wng',
  ST: 'bg-pos-st text-white border-pos-st',
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
  const sort = searchParams.get('sort') ?? ''

  const [searchInput, setSearchInput] = useState(search)

  const hasFilters = position || age || club || foot || search || status || sort

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
      {/* Search bar with icon */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder={t('players.search')}
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            debouncedSearch(e.target.value)
          }}
          className="w-full rounded-lg border border-border bg-background-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>

      {/* Position chips */}
      <div className="flex flex-wrap gap-2">
        {POSITIONS.map((pos) => {
          const isActive = position === pos
          return (
            <button
              key={pos}
              onClick={() => updateParam('position', isActive ? '' : pos)}
              className={`filter-chip ${isActive ? POSITION_CHIP_COLORS[pos] ?? 'active' : ''}`}
            >
              {t(`positions.${pos}`)}
            </button>
          )
        })}
      </div>

      {/* Other filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Age range */}
        <select
          value={age}
          onChange={(e) => updateParam('age', e.target.value)}
          className={`${selectClasses} w-auto`}
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
          className={`${selectClasses} w-auto`}
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
          className={`${selectClasses} w-auto`}
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
          className={`${selectClasses} w-auto`}
        >
          <option value="">{t('players.allStatuses')}</option>
          <option value="active">{t('players.statusActive')}</option>
          <option value="free_agent">{t('players.statusFreeAgent')}</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className={`${selectClasses} w-auto`}
        >
          <option value="">{t('players.sortName')}</option>
          <option value="most_viewed">{t('players.sortMostViewed')}</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="filter-chip !border-red-500/30 !text-red-400 hover:!bg-red-500/10"
          >
            <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            {t('players.clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
