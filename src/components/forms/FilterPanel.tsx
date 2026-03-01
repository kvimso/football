'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, type ReactNode } from 'react'
import { useLang } from '@/hooks/useLang'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { POSITIONS, PREFERRED_FEET, AGE_OPTIONS, HEIGHT_OPTIONS, WEIGHT_OPTIONS, STAT_FILTER_OPTIONS, POSITION_GLOW_CLASSES } from '@/lib/constants'
import type { Position } from '@/lib/types'
import { FilterPopover } from './FilterPopover'

interface Club {
  id: string
  name: string
  name_ka: string
}

interface FilterPanelProps {
  clubs: Club[]
}

function GlassSelect({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent/40"
      style={{ colorScheme: 'dark' }}
    >
      <option value="" className="bg-[#1a2420] text-white">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#1a2420] text-white">{opt.label}</option>
      ))}
    </select>
  )
}

function TriggerPill({ icon, label, value, hasValue }: { icon: ReactNode; label: string; value: string; hasValue: boolean }) {
  return (
    <button className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
      hasValue
        ? 'border-accent/20 bg-accent/8 text-accent'
        : 'border-white/[0.08] bg-white/[0.04] text-foreground-muted hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-foreground'
    }`}>
      {icon}
      <span className="max-w-[120px] truncate">{value || label}</span>
      <svg className="h-3 w-3 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
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
  const [clubSearch, setClubSearch] = useState('')

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
    router.push('/players')
  }

  // Compute trigger pill values
  const clubValue = activeClubs.length > 0
    ? activeClubs.map(id => {
        const c = clubs.find(cl => cl.id === id)
        return c ? (lang === 'ka' ? c.name_ka : c.name) : ''
      }).filter(Boolean).join(', ')
    : ''

  const agePhysicalValue = (ageMin || ageMax)
    ? `${ageMin || '?'} \u2013 ${ageMax || '?'}`
    : (() => {
        const count = [heightMin, heightMax, weightMin, weightMax].filter(Boolean).length
        return count > 0 ? t('players.activeFilters').replace('{count}', String(count)) : ''
      })()

  const footValue = foot ? t('foot.' + foot) : ''

  const statFilterCount = [goalsMin, assistsMin, matchesMin, passAccMin].filter(Boolean).length
  const statsValue = statFilterCount > 0 ? t('players.activeFilters').replace('{count}', String(statFilterCount)) : ''

  const sortValue = sort === 'most_viewed' ? t('players.sortMostViewed') : ''

  const statusValue = status === 'active' ? t('players.statusActive') : status === 'free_agent' ? t('players.statusFreeAgent') : ''

  return (
    <div className="relative z-10 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm space-y-4">
      {/* Layer 1: Search bar */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder={t('players.search')}
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); debouncedSearch(e.target.value) }}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-foreground-muted/60 outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(16,185,129,0.08)]"
        />
      </div>

      {/* Layer 2: Position chips */}
      <div className="flex flex-wrap gap-2">
        {POSITIONS.map((pos) => {
          const isActive = activePositions.includes(pos)
          return (
            <button
              key={pos}
              onClick={() => toggleMultiParam('position', pos, activePositions)}
              className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                isActive
                  ? POSITION_GLOW_CLASSES[pos as Position]
                  : 'border-white/[0.08] bg-white/[0.04] text-foreground-muted hover:bg-white/[0.08] hover:text-foreground'
              }`}
            >
              {t(`positions.${pos}`)}
            </button>
          )
        })}
      </div>

      {/* Layer 3: Trigger pills row */}
      <div className="flex flex-wrap gap-2">
        {/* Club popover */}
        <FilterPopover
          trigger={
            <TriggerPill
              icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>}
              label={t('players.filterClub')}
              value={clubValue}
              hasValue={activeClubs.length > 0}
            />
          }
        >
          <div className="min-w-[220px] space-y-2">
            <input
              type="text"
              placeholder={t('players.searchClub')}
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-sm text-foreground placeholder-foreground-muted/50 outline-none transition-colors focus:border-accent/40"
            />
            <div className="flex flex-wrap gap-2">
              {clubs
                .filter((c) => {
                  if (!clubSearch) return true
                  const q = clubSearch.toLowerCase()
                  return c.name.toLowerCase().includes(q) || c.name_ka.toLowerCase().includes(q)
                })
                .map((c) => {
                  const isActive = activeClubs.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleMultiParam('club', c.id, activeClubs)}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-accent/15 text-accent border-accent/30'
                          : 'bg-white/[0.04] border-white/[0.08] text-foreground-muted hover:bg-white/[0.08]'
                      }`}
                    >
                      {lang === 'ka' ? c.name_ka : c.name}
                    </button>
                  )
                })}
              {clubs.filter((c) => {
                if (!clubSearch) return true
                const q = clubSearch.toLowerCase()
                return c.name.toLowerCase().includes(q) || c.name_ka.toLowerCase().includes(q)
              }).length === 0 && (
                <span className="text-xs text-foreground-muted/50 py-1">{t('players.noResults')}</span>
              )}
            </div>
          </div>
        </FilterPopover>

        {/* Age / Physical popover */}
        <FilterPopover
          trigger={
            <TriggerPill
              icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>}
              label={t('players.filterAge')}
              value={agePhysicalValue}
              hasValue={!!(ageMin || ageMax || heightMin || heightMax || weightMin || weightMax)}
            />
          }
        >
          <div className="space-y-3 min-w-[240px]">
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted/60 font-medium">{t('players.filterAge')}</div>
            <div className="flex gap-2">
              <GlassSelect value={ageMin} onChange={(v) => updateParam('age_min', v)} placeholder={t('players.ageMin')} options={AGE_OPTIONS.map(a => ({ value: String(a), label: String(a) }))} />
              <span className="self-center text-foreground-muted/40">&ndash;</span>
              <GlassSelect value={ageMax} onChange={(v) => updateParam('age_max', v)} placeholder={t('players.ageMax')} options={AGE_OPTIONS.map(a => ({ value: String(a), label: String(a) }))} />
            </div>
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted/60 font-medium">{t('players.height')}</div>
            <div className="flex gap-2">
              <GlassSelect value={heightMin} onChange={(v) => updateParam('height_min', v)} placeholder={t('players.heightMin')} options={HEIGHT_OPTIONS.map(h => ({ value: String(h), label: `${h} ${t('players.cm')}` }))} />
              <span className="self-center text-foreground-muted/40">&ndash;</span>
              <GlassSelect value={heightMax} onChange={(v) => updateParam('height_max', v)} placeholder={t('players.heightMax')} options={HEIGHT_OPTIONS.map(h => ({ value: String(h), label: `${h} ${t('players.cm')}` }))} />
            </div>
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted/60 font-medium">{t('players.weight')}</div>
            <div className="flex gap-2">
              <GlassSelect value={weightMin} onChange={(v) => updateParam('weight_min', v)} placeholder={t('players.weightMin')} options={WEIGHT_OPTIONS.map(w => ({ value: String(w), label: `${w} ${t('players.kg')}` }))} />
              <span className="self-center text-foreground-muted/40">&ndash;</span>
              <GlassSelect value={weightMax} onChange={(v) => updateParam('weight_max', v)} placeholder={t('players.weightMax')} options={WEIGHT_OPTIONS.map(w => ({ value: String(w), label: `${w} ${t('players.kg')}` }))} />
            </div>
          </div>
        </FilterPopover>

        {/* Foot popover */}
        <FilterPopover
          trigger={
            <TriggerPill
              icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="9" /></svg>}
              label={t('players.filterFoot')}
              value={footValue}
              hasValue={!!foot}
            />
          }
        >
          <div className="space-y-1 min-w-[120px]">
            {PREFERRED_FEET.map(f => (
              <button
                key={f}
                onClick={() => updateParam('foot', foot === f ? '' : f)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  foot === f ? 'bg-accent/15 text-accent' : 'text-foreground-muted hover:bg-white/[0.06] hover:text-foreground'
                }`}
              >
                {t('foot.' + f)}
              </button>
            ))}
          </div>
        </FilterPopover>

        {/* Stats popover */}
        <FilterPopover
          trigger={
            <TriggerPill
              icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>}
              label={t('players.stats')}
              value={statsValue}
              hasValue={statFilterCount > 0}
            />
          }
        >
          <div className="space-y-3 min-w-[200px]">
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted/60 font-medium">{t('players.goals')}</div>
            <GlassSelect value={goalsMin} onChange={(v) => updateParam('goals_min', v)} placeholder={t('players.goalsMin')} options={STAT_FILTER_OPTIONS.goals.map(v => ({ value: String(v), label: `${v}+` }))} />
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted/60 font-medium">{t('players.assists')}</div>
            <GlassSelect value={assistsMin} onChange={(v) => updateParam('assists_min', v)} placeholder={t('players.assistsMin')} options={STAT_FILTER_OPTIONS.assists.map(v => ({ value: String(v), label: `${v}+` }))} />
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted/60 font-medium">{t('players.matches')}</div>
            <GlassSelect value={matchesMin} onChange={(v) => updateParam('matches_min', v)} placeholder={t('players.matchesMin')} options={STAT_FILTER_OPTIONS.matches.map(v => ({ value: String(v), label: `${v}+` }))} />
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted/60 font-medium">{t('players.passAccuracyMin')}</div>
            <GlassSelect value={passAccMin} onChange={(v) => updateParam('pass_acc_min', v)} placeholder={t('players.passAccuracyMin')} options={STAT_FILTER_OPTIONS.passAccuracy.map(v => ({ value: String(v), label: `${v}%+` }))} />
          </div>
        </FilterPopover>

        {/* Sort popover */}
        <FilterPopover
          trigger={
            <TriggerPill
              icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>}
              label={t('players.sort')}
              value={sortValue}
              hasValue={!!sort}
            />
          }
        >
          <div className="space-y-1 min-w-[140px]">
            <button
              onClick={() => updateParam('sort', '')}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                !sort ? 'bg-accent/15 text-accent' : 'text-foreground-muted hover:bg-white/[0.06] hover:text-foreground'
              }`}
            >
              {t('players.sortName')}
            </button>
            <button
              onClick={() => updateParam('sort', 'most_viewed')}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                sort === 'most_viewed' ? 'bg-accent/15 text-accent' : 'text-foreground-muted hover:bg-white/[0.06] hover:text-foreground'
              }`}
            >
              {t('players.sortMostViewed')}
            </button>
          </div>
        </FilterPopover>

        {/* Status popover */}
        <FilterPopover
          trigger={
            <TriggerPill
              icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
              label={t('players.filterStatus')}
              value={statusValue}
              hasValue={!!status}
            />
          }
          align="right"
        >
          <div className="space-y-1 min-w-[140px]">
            <button
              onClick={() => updateParam('status', '')}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                !status ? 'bg-accent/15 text-accent' : 'text-foreground-muted hover:bg-white/[0.06] hover:text-foreground'
              }`}
            >
              {t('players.allStatuses')}
            </button>
            <button
              onClick={() => updateParam('status', 'active')}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                status === 'active' ? 'bg-accent/15 text-accent' : 'text-foreground-muted hover:bg-white/[0.06] hover:text-foreground'
              }`}
            >
              {t('players.statusActive')}
            </button>
            <button
              onClick={() => updateParam('status', 'free_agent')}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                status === 'free_agent' ? 'bg-accent/15 text-accent' : 'text-foreground-muted hover:bg-white/[0.06] hover:text-foreground'
              }`}
            >
              {t('players.statusFreeAgent')}
            </button>
          </div>
        </FilterPopover>
      </div>

      {/* Layer 4: Active filter summary strip */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
          {/* Position tags */}
          {activePositions.map(pos => (
            <span key={pos} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t(`positions.${pos}`)}
              <button onClick={() => toggleMultiParam('position', pos, activePositions)} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          ))}
          {/* Club tags */}
          {activeClubs.map(clubId => {
            const c = clubs.find(cl => cl.id === clubId)
            if (!c) return null
            return (
              <span key={clubId} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
                {lang === 'ka' ? c.name_ka : c.name}
                <button onClick={() => toggleMultiParam('club', clubId, activeClubs)} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
              </span>
            )
          })}
          {/* Age tag */}
          {(ageMin || ageMax) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('players.filterAge')}: {ageMin || '?'}&ndash;{ageMax || '?'}
              <button onClick={() => { updateParam('age_min', ''); updateParam('age_max', '') }} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {/* Foot tag */}
          {foot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('foot.' + foot)}
              <button onClick={() => updateParam('foot', '')} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {/* Height tag */}
          {(heightMin || heightMax) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('players.height')}: {heightMin || '?'}&ndash;{heightMax || '?'} {t('players.cm')}
              <button onClick={() => { updateParam('height_min', ''); updateParam('height_max', '') }} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {/* Weight tag */}
          {(weightMin || weightMax) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('players.weight')}: {weightMin || '?'}&ndash;{weightMax || '?'} {t('players.kg')}
              <button onClick={() => { updateParam('weight_min', ''); updateParam('weight_max', '') }} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {/* Stat filter tags */}
          {goalsMin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('players.goals')}: {goalsMin}+
              <button onClick={() => updateParam('goals_min', '')} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {assistsMin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('players.assists')}: {assistsMin}+
              <button onClick={() => updateParam('assists_min', '')} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {matchesMin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('players.matches')}: {matchesMin}+
              <button onClick={() => updateParam('matches_min', '')} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {passAccMin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('players.passAccuracyMin')}: {passAccMin}%+
              <button onClick={() => updateParam('pass_acc_min', '')} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {/* Sort tag */}
          {sort && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {t('players.sort')}: {sort === 'most_viewed' ? t('players.sortMostViewed') : sort}
              <button onClick={() => updateParam('sort', '')} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {/* Status tag */}
          {status && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              {status === 'active' ? t('players.statusActive') : t('players.statusFreeAgent')}
              <button onClick={() => updateParam('status', '')} className="ml-0.5 text-foreground-muted/50 hover:text-foreground transition-colors">&times;</button>
            </span>
          )}
          {/* Clear All */}
          <button
            onClick={clearFilters}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            {t('players.clearAll')}
          </button>
        </div>
      )}
    </div>
  )
}
