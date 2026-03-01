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

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
  className?: string
}

function FilterSelect({ value, onChange, placeholder, options, className }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors w-auto ${className ?? ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
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
        <FilterSelect
          value={ageMin}
          onChange={(v) => updateParam('age_min', v)}
          placeholder={t('players.ageMin')}
          options={AGE_OPTIONS.map(age => ({ value: String(age), label: String(age) }))}
        />
        <FilterSelect
          value={ageMax}
          onChange={(v) => updateParam('age_max', v)}
          placeholder={t('players.ageMax')}
          options={AGE_OPTIONS.map(age => ({ value: String(age), label: String(age) }))}
        />
        <FilterSelect
          value={foot}
          onChange={(v) => updateParam('foot', v)}
          placeholder={t('players.allFeet')}
          options={PREFERRED_FEET.map(f => ({ value: f, label: t('foot.' + f) }))}
        />
        <FilterSelect
          value={status}
          onChange={(v) => updateParam('status', v)}
          placeholder={t('players.allStatuses')}
          options={[
            { value: 'active', label: t('players.statusActive') },
            { value: 'free_agent', label: t('players.statusFreeAgent') },
          ]}
        />
        <FilterSelect
          value={sort}
          onChange={(v) => updateParam('sort', v)}
          placeholder={t('players.sortName')}
          options={[{ value: 'most_viewed', label: t('players.sortMostViewed') }]}
        />

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
          <FilterSelect
            value={heightMin}
            onChange={(v) => updateParam('height_min', v)}
            placeholder={t('players.heightMin')}
            options={HEIGHT_OPTIONS.map(h => ({ value: String(h), label: `${h} ${t('players.cm')}` }))}
          />
          <FilterSelect
            value={heightMax}
            onChange={(v) => updateParam('height_max', v)}
            placeholder={t('players.heightMax')}
            options={HEIGHT_OPTIONS.map(h => ({ value: String(h), label: `${h} ${t('players.cm')}` }))}
          />
          <FilterSelect
            value={weightMin}
            onChange={(v) => updateParam('weight_min', v)}
            placeholder={t('players.weightMin')}
            options={WEIGHT_OPTIONS.map(w => ({ value: String(w), label: `${w} ${t('players.kg')}` }))}
          />
          <FilterSelect
            value={weightMax}
            onChange={(v) => updateParam('weight_max', v)}
            placeholder={t('players.weightMax')}
            options={WEIGHT_OPTIONS.map(w => ({ value: String(w), label: `${w} ${t('players.kg')}` }))}
          />
          <FilterSelect
            value={goalsMin}
            onChange={(v) => updateParam('goals_min', v)}
            placeholder={t('players.goalsMin')}
            options={STAT_FILTER_OPTIONS.goals.map(v => ({ value: String(v), label: `${v}+` }))}
          />
          <FilterSelect
            value={assistsMin}
            onChange={(v) => updateParam('assists_min', v)}
            placeholder={t('players.assistsMin')}
            options={STAT_FILTER_OPTIONS.assists.map(v => ({ value: String(v), label: `${v}+` }))}
          />
          <FilterSelect
            value={matchesMin}
            onChange={(v) => updateParam('matches_min', v)}
            placeholder={t('players.matchesMin')}
            options={STAT_FILTER_OPTIONS.matches.map(v => ({ value: String(v), label: `${v}+` }))}
          />
          <FilterSelect
            value={passAccMin}
            onChange={(v) => updateParam('pass_acc_min', v)}
            placeholder={t('players.passAccuracyMin')}
            options={STAT_FILTER_OPTIONS.passAccuracy.map(v => ({ value: String(v), label: `${v}%+` }))}
          />
        </div>
      )}
    </div>
  )
}
