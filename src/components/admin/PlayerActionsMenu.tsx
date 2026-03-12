'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { releasePlayer } from '@/app/actions/admin-transfers'

interface PlayerActionsMenuProps {
  playerId: string
  playerName: string
  isActive: boolean
}

export function PlayerActionsMenu({ playerId, playerName, isActive }: PlayerActionsMenuProps) {
  const { t } = useLang()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  async function handleRelease() {
    const confirmed = window.confirm(
      t('admin.transfers.confirmRelease').replace('{name}', playerName)
    )
    if (!confirmed) return

    setReleasing(true)
    setErrorMsg('')
    const result = await releasePlayer(playerId)
    if (result.error) {
      setErrorMsg(result.error.startsWith('errors.') ? t(result.error) : result.error)
    } else {
      router.refresh()
    }
    setReleasing(false)
    setOpen(false)
  }

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
        aria-label={t('admin.common.actions')}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-slide-in-down">
          <button
            onClick={() => {
              setOpen(false)
              router.push(`/admin/players/${playerId}/edit`)
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-background-secondary"
          >
            <svg
              className="h-3.5 w-3.5 text-foreground-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
              />
            </svg>
            {t('common.edit')}
          </button>

          {isActive && (
            <button
              onClick={handleRelease}
              disabled={releasing}
              className="flex w-full items-center gap-2.5 border-t border-border px-3.5 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              {releasing ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-600/30 border-t-red-600" />
              ) : (
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
              )}
              {releasing ? t('common.loading') : t('admin.transfers.release')}
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-600">
          {errorMsg}
        </div>
      )}
    </div>
  )
}
