'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { useLang } from '@/hooks/useLang'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { POSITIONS, PREFERRED_FEET, AGE_OPTIONS, HEIGHT_OPTIONS, WEIGHT_OPTIONS, STAT_FILTER_OPTIONS } from '@/lib/constants'

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
  const ageMin = searchParams.get('age_min') ?? ''
  const ageMax = searchParams.get('age_max') ?? ''
  const club = searchParams.get('club') ?? ''
  const foot = searchParams.get('foot') ?? ''
  const search = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const sort = searchParams.get('sort') ?? ''
  const heightMin = searchParams.get('height_min') ?? ''
  const heightMax = searchParams.get('height_max') ?? ''
  const weightMin = searchParams.get('weight_min') ?? ''
  const weightMax = searchParams.get('weight_max') ?? ''
  const goalsMin = searchParams.get('goals_min') ?? ''
  const assistsMin = searchParams.get('assists_min') ?? ''
  const matchesMin = searchParams.get('matches_min') ?? ''
  const passAccMin = searchParams.get('pass_acc_min') ?? ''

  const [searchInput, setSearchInput] = useState(search)

  const hasAdvancedFilters = heightMin || heightMax || weightMin || weightMax || goalsMin || assistsMin || matchesMin || passAccMin
  const [advancedOpen, setAdvancedOpen] = useState(!!hasAdvancedFilters)

  const hasFilters = position || ageMin || ageMax || club || foot || search || status || sort || heightMin || heightMax || weightMin || weightMax || goalsMin || assistsMin || matchesMin || passAccMin

  // Parse multi-value params
  const activePositions = position ? position.split(',') : []
  const activeClubs = club ? club.split(',') : []

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`/players?${params.toString()}`)
    },
    [router, searchParams]
  )

  const toggleMultiParam = useCallback(
    (key: string, value: string, currentValues: string[]) => {
      const next = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      updateParam(key, next.join(','))
    },
    [updateParam]
  )

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParam('q', value)
  }, 400)

  const clearFilters = () => {
    setSearchInput('')
    setAdvancedOpen(false)
    router.push('/players')
  }

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

      {/* Position chips — multi-select */}
      <div className="flex flex-wrap gap-2">
        {POSITIONS.map((pos) => {
          const isActive = activePositions.includes(pos)
          return (
            <button
              key={pos}
              onClick={() => toggleMultiParam('position', pos, activePositions)}
              className={`filter-chip ${isActive ? POSITION_CHIP_COLORS[pos] ?? 'active' : ''}`}
            >
              {t(`positions.${pos}`)}
            </button>
          )
        })}
      </div>

      {/* Club chips — multi-select */}
      {clubs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {clubs.map((c) => {
            const isActive = activeClubs.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => toggleMultiParam('club', c.id, activeClubs)}
                className={`filter-chip ${isActive ? 'bg-accent text-white border-accent' : ''}`}
              >
                {lang === 'ka' ? c.name_ka : c.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Other filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Age min */}
        <select
          value={ageMin}
          onChange={(e) => updateParam('age_min', e.target.value)}
          className={`${selectClasses} w-auto`}
        >
          <option value="">{t('players.ageMin')}</option>
          {AGE_OPTIONS.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </select>

        {/* Age max */}
        <select
          value={ageMax}
          onChange={(e) => updateParam('age_max', e.target.value)}
          className={`${selectClasses} w-auto`}
        >
          <option value="">{t('players.ageMax')}</option>
          {AGE_OPTIONS.map((age) => (
            <option key={age} value={age}>
              {age}
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

        {/* Advanced filters toggle */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className={`filter-chip ${advancedOpen || hasAdvancedFilters ? 'bg-accent/10 text-accent border-accent/30' : ''}`}
        >
          <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          {t('players.advancedFilters')}
        </button>

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

      {/* Advanced filters — height, weight, stat ranges */}
      {advancedOpen && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border/50 bg-background-secondary/50 p-3">
          <select
            value={heightMin}
            onChange={(e) => updateParam('height_min', e.target.value)}
            className={`${selectClasses} w-auto`}
          >
            <option value="">{t('players.heightMin')}</option>
            {HEIGHT_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h} {t('players.cm')}
              </option>
            ))}
          </select>

          <select
            value={heightMax}
            onChange={(e) => updateParam('height_max', e.target.value)}
            className={`${selectClasses} w-auto`}
          >
            <option value="">{t('players.heightMax')}</option>
            {HEIGHT_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h} {t('players.cm')}
              </option>
            ))}
          </select>

          <select
            value={weightMin}
            onChange={(e) => updateParam('weight_min', e.target.value)}
            className={`${selectClasses} w-auto`}
          >
            <option value="">{t('players.weightMin')}</option>
            {WEIGHT_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {w} {t('players.kg')}
              </option>
            ))}
          </select>

          <select
            value={weightMax}
            onChange={(e) => updateParam('weight_max', e.target.value)}
            className={`${selectClasses} w-auto`}
          >
            <option value="">{t('players.weightMax')}</option>
            {WEIGHT_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {w} {t('players.kg')}
              </option>
            ))}
          </select>

          <select
            value={goalsMin}
            onChange={(e) => updateParam('goals_min', e.target.value)}
            className={`${selectClasses} w-auto`}
          >
            <option value="">{t('players.goalsMin')}</option>
            {STAT_FILTER_OPTIONS.goals.map((v) => (
              <option key={v} value={v}>
                {v}+
              </option>
            ))}
          </select>

          <select
            value={assistsMin}
            onChange={(e) => updateParam('assists_min', e.target.value)}
            className={`${selectClasses} w-auto`}
          >
            <option value="">{t('players.assistsMin')}</option>
            {STAT_FILTER_OPTIONS.assists.map((v) => (
              <option key={v} value={v}>
                {v}+
              </option>
            ))}
          </select>

          <select
            value={matchesMin}
            onChange={(e) => updateParam('matches_min', e.target.value)}
            className={`${selectClasses} w-auto`}
          >
            <option value="">{t('players.matchesMin')}</option>
            {STAT_FILTER_OPTIONS.matches.map((v) => (
              <option key={v} value={v}>
                {v}+
              </option>
            ))}
          </select>

          <select
            value={passAccMin}
            onChange={(e) => updateParam('pass_acc_min', e.target.value)}
            className={`${selectClasses} w-auto`}
          >
            <option value="">{t('players.passAccuracyMin')}</option>
            {STAT_FILTER_OPTIONS.passAccuracy.map((v) => (
              <option key={v} value={v}>
                {v}%+
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
