'use client'

import { useState } from 'react'
import { useLang } from '@/hooks/useLang'

interface DownloadPdfButtonProps {
  playerId: string
  playerName: string
}

export function DownloadPdfButton({ playerId, playerName }: DownloadPdfButtonProps) {
  const { t } = useLang()
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`/api/players/${playerId}/pdf`)
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${playerName.replace(/[^a-zA-Z0-9]/g, '_')}_Profile.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:border-accent/50 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {loading ? t('players.downloadingPdf') : t('players.downloadPdf')}
    </button>
  )
}
