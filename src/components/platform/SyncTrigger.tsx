'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function SyncTrigger() {
  const { t } = useLang()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [syncType, setSyncType] = useState<'player' | 'match_report' | 'heatmap'>('player')
  const [matchId, setMatchId] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ status: string; message: string } | null>(null)

  const needsMatchId = syncType === 'match_report' || syncType === 'heatmap'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError(t('platform.camera.sync.selectFile'))
      return
    }

    // Client-side file size check before FileReader
    if (file.size > MAX_FILE_SIZE) {
      setError(t('platform.camera.errors.fileTooLarge'))
      return
    }

    if (needsMatchId && !matchId.trim()) {
      setError(t('platform.camera.sync.matchIdHelp'))
      return
    }

    setSyncing(true)

    try {
      const text = await file.text()

      let data: unknown
      try {
        data = JSON.parse(text)
      } catch {
        setError(t('platform.camera.errors.invalidJson'))
        setSyncing(false)
        return
      }

      const payload: Record<string, unknown> = { type: syncType, data }
      if (needsMatchId) payload.match_id = matchId.trim()

      const res = await fetch('/api/camera/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? t('platform.camera.sync.syncFailed'))
      } else {
        const status = json.status ?? 'success'
        const key =
          status === 'success'
            ? 'platform.camera.sync.syncSuccess'
            : status === 'partial'
              ? 'platform.camera.sync.syncPartial'
              : 'platform.camera.sync.syncFailed'
        setResult({ status, message: t(key) })
        router.refresh()
      }
    } catch {
      setError(t('platform.camera.sync.syncFailed'))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-base font-semibold text-foreground">
        {t('platform.camera.sync.trigger')}
      </h3>
      <p className="mt-1 text-sm text-foreground-muted">
        {t('platform.camera.sync.triggerDescription')}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-muted p-3 text-sm text-danger">
            {error}
          </div>
        )}
        {result && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              result.status === 'success'
                ? 'border-primary/30 bg-primary/5 text-primary'
                : result.status === 'partial'
                  ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-600'
                  : 'border-danger/30 bg-danger-muted text-danger'
            }`}
          >
            {result.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('platform.camera.sync.syncType')}
            </label>
            <select
              value={syncType}
              onChange={(e) => setSyncType(e.target.value as 'player' | 'match_report' | 'heatmap')}
              className="input w-full"
            >
              <option value="player">Player Profile</option>
              <option value="match_report">Match Report</option>
              <option value="heatmap">Heatmap</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('platform.camera.sync.selectFile')}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="block w-full text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20 file:transition-colors file:cursor-pointer"
            />
          </div>
        </div>

        {needsMatchId && (
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('platform.camera.sync.matchId')}
            </label>
            <input
              type="text"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="input w-full"
              placeholder="UUID"
            />
            <p className="mt-1 text-xs text-foreground-muted">
              {t('platform.camera.sync.matchIdHelp')}
            </p>
          </div>
        )}

        <button type="submit" disabled={syncing} className="btn-primary text-sm">
          {syncing ? t('platform.camera.sync.syncing') : t('platform.camera.sync.trigger')}
        </button>
      </form>
    </div>
  )
}
