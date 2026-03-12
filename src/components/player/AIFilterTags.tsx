'use client'

import { useLang } from '@/hooks/useLang'
import type { AISearchFilters } from '@/lib/ai-search/types'

interface AIFilterTagsProps {
  filters: AISearchFilters
  onRemoveFilter: (key: keyof AISearchFilters) => void
  onClearAll: () => void
}

/** Maps a filter key+value to a human-readable label using i18n */
function useFilterLabel() {
  const { t } = useLang()

  return (key: string, value: unknown): string | null => {
    const v = String(value)
    switch (key) {
      case 'position':
        return `${t('aiSearch.position')}: ${t(`positions.${v}`)}`
      case 'preferred_foot':
        return `${t('aiSearch.foot')}: ${t(`foot.${v}`)}`
      case 'nationality':
        return `${t('aiSearch.nationality')}: ${v}`
      case 'status':
        return `${v}`
      case 'min_age':
        return t('aiSearch.minAge').replace('{value}', v)
      case 'max_age':
        return t('aiSearch.maxAge').replace('{value}', v)
      case 'min_height_cm':
        return t('aiSearch.minHeight').replace('{value}', v)
      case 'max_height_cm':
        return t('aiSearch.maxHeight').replace('{value}', v)
      case 'min_weight_kg':
        return t('aiSearch.minWeight').replace('{value}', v)
      case 'max_weight_kg':
        return t('aiSearch.maxWeight').replace('{value}', v)
      case 'club_name':
        return `${t('aiSearch.club')}: ${v}`
      case 'min_pace':
        return t('aiSearch.pace').replace('{value}', v)
      case 'min_shooting':
        return t('aiSearch.shooting').replace('{value}', v)
      case 'min_passing':
        return t('aiSearch.passing').replace('{value}', v)
      case 'min_dribbling':
        return t('aiSearch.dribbling').replace('{value}', v)
      case 'min_defending':
        return t('aiSearch.defending').replace('{value}', v)
      case 'min_physical':
        return t('aiSearch.physical').replace('{value}', v)
      case 'min_goals':
        return t('aiSearch.goals').replace('{value}', v)
      case 'min_assists':
        return t('aiSearch.assists').replace('{value}', v)
      case 'min_matches_played':
        return t('aiSearch.matchesPlayed').replace('{value}', v)
      case 'min_pass_accuracy':
        return t('aiSearch.passAccuracy').replace('{value}', v)
      case 'min_tackles':
        return t('aiSearch.tackles').replace('{value}', v)
      case 'min_interceptions':
        return t('aiSearch.interceptions').replace('{value}', v)
      case 'min_clean_sheets':
        return t('aiSearch.cleanSheets').replace('{value}', v)
      case 'min_shots_on_target':
        return t('aiSearch.shotsOnTarget').replace('{value}', v)
      case 'sort_by':
        return t('aiSearch.sortedBy').replace('{value}', v)
      case 'sort_direction':
        return null // Don't show sort direction as separate tag
      default:
        return null
    }
  }
}

// Keys to skip when rendering tags (sort_direction shown as part of sort_by)
const SKIP_KEYS = new Set(['sort_direction'])

export function AIFilterTags({ filters, onRemoveFilter, onClearAll }: AIFilterTagsProps) {
  const { t } = useLang()
  const getLabel = useFilterLabel()

  const entries = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && !SKIP_KEYS.has(key)
  )

  if (entries.length === 0) return null

  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-2"
      role="region"
      aria-label={t('aiSearch.label')}
    >
      <span className="text-xs font-medium text-purple-700/80">{t('aiSearch.label')}:</span>
      {entries.map(([key, value]) => {
        const label = getLabel(key, value)
        if (!label) return null
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-700"
          >
            {label}
            <button
              onClick={() => onRemoveFilter(key as keyof AISearchFilters)}
              className="ml-0.5 text-purple-500/50 hover:text-purple-700 transition-colors"
              aria-label={`${t('aiSearch.clear')} ${label}`}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )
      })}
      <button
        onClick={onClearAll}
        className="ml-auto inline-flex items-center gap-1 rounded-full border border-purple-500/15 bg-purple-500/5 px-2.5 py-1 text-[11px] font-medium text-purple-700/70 transition-colors hover:bg-purple-500/10 hover:text-purple-500"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        {t('aiSearch.clearAll')}
      </button>
    </div>
  )
}
