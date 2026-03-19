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
      case 'min_overall':
        return t('aiSearch.overall').replace('{value}', v)
      case 'min_attack':
        return t('aiSearch.attack').replace('{value}', v)
      case 'min_defence':
        return t('aiSearch.defence').replace('{value}', v)
      case 'min_fitness':
        return t('aiSearch.fitness').replace('{value}', v)
      case 'min_dribbling':
        return t('aiSearch.dribbling').replace('{value}', v)
      case 'min_shooting':
        return t('aiSearch.shooting').replace('{value}', v)
      case 'min_possession':
        return t('aiSearch.possession').replace('{value}', v)
      case 'min_tackling':
        return t('aiSearch.tackling').replace('{value}', v)
      case 'min_positioning':
        return t('aiSearch.positioning').replace('{value}', v)
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
      <span className="text-xs font-medium text-primary">{t('aiSearch.label')}:</span>
      {entries.map(([key, value]) => {
        const label = getLabel(key, value)
        if (!label) return null
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
          >
            {label}
            <button
              onClick={() => onRemoveFilter(key as keyof AISearchFilters)}
              className="ml-0.5 text-primary/50 hover:text-primary transition-colors"
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
        className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary"
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
