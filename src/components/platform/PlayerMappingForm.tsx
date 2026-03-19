'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import {
  createPlayerMapping,
  updatePlayerMapping,
  deletePlayerMapping,
} from '@/app/actions/platform-camera'

interface PlayerSearchResult {
  id: string
  name: string
  name_ka: string
  position: string
  club_id: string | null
  club_name: string | null
  club_name_ka: string | null
}

interface PlayerMappingFormProps {
  mapping?: {
    id: string
    starlive_player_id: number
    player_id: string
    starlive_team_id: number | null
    club_id: string | null
    jersey_number: string | null
  }
  initialPlayerName?: string
  initialClubName?: string
}

export function PlayerMappingForm({
  mapping,
  initialPlayerName,
  initialClubName,
}: PlayerMappingFormProps) {
  const { t, lang } = useLang()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Player search state
  const [playerId, setPlayerId] = useState(mapping?.player_id ?? '')
  const [clubName, setClubName] = useState(initialClubName ?? '')
  const [clubId, setClubId] = useState(mapping?.club_id ?? '')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlayerSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(initialPlayerName ?? '')
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    []
  )

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '15' })
      if (q) params.set('q', q)
      const res = await fetch(`/api/players/search?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await res.json()
      setResults(data.players ?? [])
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setResults([])
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  const debouncedSearch = useDebouncedCallback((q: string) => {
    search(q)
  }, 300)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelectPlayer(p: PlayerSearchResult) {
    setPlayerId(p.id)
    setClubId(p.club_id ?? '')
    setClubName(lang === 'ka' ? (p.club_name_ka ?? p.club_name ?? '') : (p.club_name ?? ''))
    setSelectedLabel(lang === 'ka' ? p.name_ka : p.name)
    setQuery('')
    setIsOpen(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      player_id: playerId,
      starlive_player_id: Number(formData.get('starlive_player_id')),
      starlive_team_id: formData.get('starlive_team_id')
        ? Number(formData.get('starlive_team_id'))
        : null,
      club_id: clubId || null,
      jersey_number: String(formData.get('jersey_number') ?? '') || null,
    }

    const result = mapping
      ? await updatePlayerMapping(mapping.id, data)
      : await createPlayerMapping(data)

    setSaving(false)

    if (!result.success) {
      setError(result.error.startsWith('platform.') ? t(result.error) : result.error)
    } else {
      router.push('/platform/camera/mappings')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-muted p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Player search select */}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.camera.mappings.player')}
        </label>
        <div ref={containerRef} className="relative">
          <input
            type="text"
            value={isOpen ? query : selectedLabel}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
              debouncedSearch(e.target.value)
            }}
            onFocus={() => {
              setIsOpen(true)
              if (!results.length) search('')
            }}
            placeholder={t('platform.camera.mappings.searchPlayer')}
            className="input w-full"
          />
          {playerId && (
            <button
              type="button"
              onClick={() => {
                setPlayerId('')
                setClubId('')
                setClubName('')
                setSelectedLabel('')
                setQuery('')
                setResults([])
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
              {isLoading && (
                <div className="px-3 py-2 text-sm text-foreground-muted">{t('common.loading')}</div>
              )}
              {!isLoading && results.length === 0 && query.length > 0 && (
                <div className="px-3 py-2 text-sm text-foreground-muted">
                  {t('common.noResults')}
                </div>
              )}
              {results.map((p) => {
                const name = lang === 'ka' ? p.name_ka : p.name
                const club = lang === 'ka' ? p.club_name_ka : p.club_name
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlayer(p)}
                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-primary/10 transition-colors"
                  >
                    <span className="font-medium">{name}</span>
                    <span className="ml-1.5 text-foreground-muted">({p.position})</span>
                    {club && <span className="ml-1 text-xs text-foreground-muted">· {club}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Club (auto-populated, read-only) */}
      {clubName && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('platform.camera.mappings.club')}
          </label>
          <p className="text-sm text-foreground">{clubName}</p>
          <p className="text-xs text-foreground-muted">
            {t('platform.camera.mappings.clubAutoPopulated')}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('platform.camera.mappings.starliveId')}
          </label>
          <input
            name="starlive_player_id"
            type="number"
            required
            min={1}
            defaultValue={mapping?.starlive_player_id ?? ''}
            className="input w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('platform.camera.mappings.starliveTeamId')}
          </label>
          <input
            name="starlive_team_id"
            type="number"
            defaultValue={mapping?.starlive_team_id ?? ''}
            className="input w-full"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.camera.mappings.jerseyNumber')}
        </label>
        <input
          name="jersey_number"
          type="text"
          defaultValue={mapping?.jersey_number ?? ''}
          className="input w-full"
          placeholder="Optional"
          maxLength={10}
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving || !playerId} className="btn-primary text-sm">
          {saving ? t('common.loading') : t('common.save')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/platform/camera/mappings')}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}

// Delete button (used in list page)
export function DeletePlayerMappingButton({ mappingId }: { mappingId: string }) {
  const { t } = useLang()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(t('platform.camera.mappings.deleteConfirm'))) return
    setDeleting(true)
    const result = await deletePlayerMapping(mappingId)
    setDeleting(false)
    if (result.success) {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-danger hover:underline disabled:opacity-50"
    >
      {deleting ? '...' : t('common.delete')}
    </button>
  )
}
