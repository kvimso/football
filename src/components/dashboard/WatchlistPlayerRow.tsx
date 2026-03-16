'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { removeFromWatchlist, updateWatchlistNotes } from '@/app/actions/watchlist'
import { addTag, removeTag } from '@/app/actions/watchlist-tags'
import { addToFolder, removeFromFolder } from '@/app/actions/watchlist-folders'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import type { WatchlistItem, Folder } from './WatchlistPage'

interface Props {
  item: WatchlistItem
  tags: Array<{ id: string; tag: string }>
  folderIds: string[]
  folders: Folder[]
  onRemove: (playerId: string) => void
  onTagAdded: (watchlistId: string, tag: { id: string; tag: string }) => void
  onTagRemoved: (watchlistId: string, tagId: string) => void
  onFolderAssigned: (watchlistId: string, folderId: string) => void
  onFolderUnassigned: (watchlistId: string, folderId: string) => void
}

export function WatchlistPlayerRow({
  item,
  tags,
  folderIds,
  folders,
  onRemove,
  onTagAdded,
  onTagRemoved,
  onFolderAssigned,
  onFolderUnassigned,
}: Props) {
  const { t, lang } = useLang()
  const [isPending, startTransition] = useTransition()
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(item.notes ?? '')
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [showFolderMenu, setShowFolderMenu] = useState(false)

  const player = item.player
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = player.club ? (lang === 'ka' ? player.club.name_ka : player.club.name) : null
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-primary/20 text-primary'
  const age = calculateAge(player.date_of_birth)

  function handleRemove() {
    startTransition(async () => {
      await removeFromWatchlist(item.player_id)
      onRemove(item.player_id)
    })
  }

  function handleSaveNote() {
    startTransition(async () => {
      await updateWatchlistNotes(item.player_id, noteText)
      setEditingNote(false)
    })
  }

  function handleAddTag() {
    const normalized = tagInput.toLowerCase().trim()
    if (!normalized) return
    startTransition(async () => {
      const result = await addTag(item.id, normalized)
      if (!result.error) {
        // We don't get the tag id back from the action, trigger a refresh
        onTagAdded(item.id, { id: crypto.randomUUID(), tag: normalized })
        setTagInput('')
        setShowTagInput(false)
      }
    })
  }

  function handleRemoveTag(tagId: string) {
    startTransition(async () => {
      const result = await removeTag(tagId)
      if (!result.error) onTagRemoved(item.id, tagId)
    })
  }

  function handleToggleFolder(folderId: string) {
    const isAssigned = folderIds.includes(folderId)
    startTransition(async () => {
      if (isAssigned) {
        const result = await removeFromFolder(folderId, item.id)
        if (!result.error) onFolderUnassigned(item.id, folderId)
      } else {
        const result = await addToFolder(folderId, item.id)
        if (!result.error) onFolderAssigned(item.id, folderId)
      }
    })
    setShowFolderMenu(false)
  }

  return (
    <div className="card p-3">
      {/* Top row: player info + actions */}
      <div className="flex items-start gap-3">
        {/* Photo */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              fill
              className="rounded-lg object-cover"
              sizes="44px"
            />
          ) : (
            <PlayerSilhouette size="sm" className="text-foreground-muted/30" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/players/${player.slug}`}
              className="font-medium text-foreground hover:text-primary transition-colors truncate"
            >
              {displayName}
            </Link>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}
            >
              {player.position}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
            {clubName && <span>{clubName}</span>}
            {clubName && <span>&middot;</span>}
            <span>
              {age} {t('players.years')}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Folder menu */}
          {folders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowFolderMenu(!showFolderMenu)}
                className="rounded p-1 text-foreground-muted/50 hover:text-foreground transition-colors"
                title={t('dashboard.assignToFolder')}
              >
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
                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                  />
                </svg>
              </button>
              {showFolderMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-lg border border-border bg-surface shadow-lg py-1">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleToggleFolder(folder.id)}
                      disabled={isPending}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground-muted hover:bg-surface hover:text-foreground"
                    >
                      <span
                        className={`h-3 w-3 rounded border ${folderIds.includes(folder.id) ? 'bg-primary border-primary' : 'border-border'}`}
                      >
                        {folderIds.includes(folder.id) && (
                          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{folder.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Remove */}
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="rounded p-1 text-foreground-muted/50 hover:text-red-600 transition-colors disabled:opacity-50"
            title={t('dashboard.removeFromWatchlist')}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tags row */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-0.5 rounded-full bg-surface px-2 py-0.5 text-[11px] text-foreground-muted"
          >
            #{tag.tag}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              disabled={isPending}
              className="ml-0.5 hover:text-red-600"
            >
              &times;
            </button>
          </span>
        ))}
        {showTagInput ? (
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag()
                if (e.key === 'Escape') {
                  setShowTagInput(false)
                  setTagInput('')
                }
              }}
              placeholder={t('dashboard.tagPlaceholder')}
              className="w-28 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground outline-none focus:border-primary"
              maxLength={30}
              autoFocus
            />
            <button
              onClick={handleAddTag}
              disabled={isPending || !tagInput.trim()}
              className="text-[11px] text-primary"
            >
              &#10003;
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-foreground-muted/50 hover:text-primary hover:border-primary transition-colors"
          >
            + {t('dashboard.addTag')}
          </button>
        )}
      </div>

      {/* Notes row */}
      <div className="mt-2">
        {editingNote ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNote()
                if (e.key === 'Escape') setEditingNote(false)
              }}
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
              placeholder={t('dashboard.notesPlaceholder')}
              autoFocus
            />
            <button
              onClick={handleSaveNote}
              disabled={isPending}
              className="text-xs text-primary hover:underline"
            >
              {t('dashboard.saveNote')}
            </button>
            <button
              onClick={() => setEditingNote(false)}
              className="text-xs text-foreground-muted hover:underline"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {item.notes ? (
              <span className="text-xs text-foreground-muted/70 italic truncate">
                &quot;{item.notes}&quot;
              </span>
            ) : null}
            <button
              onClick={() => setEditingNote(true)}
              className="shrink-0 text-xs text-foreground-muted/50 hover:text-primary"
            >
              {item.notes ? t('dashboard.editNote') : t('dashboard.addNote')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
