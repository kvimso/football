'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/hooks/useLang'
import { createFolder, renameFolder, deleteFolder } from '@/app/actions/watchlist-folders'
import type { Folder } from './WatchlistPage'

interface Props {
  folders: Folder[]
  folderCounts: Record<string, number>
  totalCount: number
  activeFolder: string | null
  allTags: string[]
  activeTags: string[]
  onSelectFolder: (id: string | null) => void
  onSelectTag: (tag: string) => void
  onFolderCreated: (folder: Folder) => void
  onFolderDeleted: (folderId: string) => void
  onFolderRenamed: (folderId: string, name: string) => void
}

export function WatchlistSidebar({
  folders,
  folderCounts,
  totalCount,
  activeFolder,
  allTags,
  activeTags,
  onSelectFolder,
  onSelectTag,
  onFolderCreated,
  onFolderDeleted,
  onFolderRenamed,
}: Props) {
  const { t } = useLang()
  const [isPending, startTransition] = useTransition()
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')

  function handleCreateFolder() {
    if (!newFolderName.trim()) return
    startTransition(async () => {
      const result = await createFolder(newFolderName.trim())
      if (result.success && result.folderId) {
        onFolderCreated({
          id: result.folderId,
          name: newFolderName.trim(),
          created_at: new Date().toISOString(),
        })
        setNewFolderName('')
        setShowNewFolder(false)
      }
    })
  }

  function handleRename(folderId: string) {
    if (!renameText.trim()) return
    startTransition(async () => {
      const result = await renameFolder(folderId, renameText.trim())
      if (result.success) {
        onFolderRenamed(folderId, renameText.trim())
        setRenamingId(null)
      }
    })
  }

  function handleDelete(folderId: string) {
    if (!confirm(t('dashboard.deleteFolderConfirm'))) return
    startTransition(async () => {
      const result = await deleteFolder(folderId)
      if (result.success) onFolderDeleted(folderId)
    })
  }

  return (
    <div className="space-y-4">
      {/* Folders */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            {t('dashboard.folders')}
          </h3>
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            className="text-xs text-accent hover:underline"
            disabled={isPending}
          >
            + {t('dashboard.createFolder')}
          </button>
        </div>

        {showNewFolder && (
          <div className="mb-2 flex gap-1.5">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder={t('dashboard.folderName')}
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              disabled={isPending || !newFolderName.trim()}
              className="rounded bg-accent px-2 py-1 text-xs text-white disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {/* All */}
          <button
            onClick={() => onSelectFolder(null)}
            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
              !activeFolder
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
            }`}
          >
            <span>{t('dashboard.allPlayers')}</span>
            <span className="text-[10px]">{totalCount}</span>
          </button>

          {/* Each folder */}
          {folders.map((folder) => (
            <div key={folder.id} className="group flex items-center">
              {renamingId === folder.id ? (
                <div className="flex flex-1 gap-1 px-1">
                  <input
                    type="text"
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(folder.id)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-accent"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(folder.id)}
                    disabled={isPending}
                    className="text-xs text-accent"
                  >
                    &#10003;
                  </button>
                  <button
                    onClick={() => setRenamingId(null)}
                    className="text-xs text-foreground-muted"
                  >
                    &#10005;
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onSelectFolder(activeFolder === folder.id ? null : folder.id)}
                    className={`flex flex-1 items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                      activeFolder === folder.id
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                    }`}
                  >
                    <span className="truncate">{folder.name}</span>
                    <span className="text-[10px]">{folderCounts[folder.id] ?? 0}</span>
                  </button>
                  <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                    <button
                      onClick={() => {
                        setRenamingId(folder.id)
                        setRenameText(folder.name)
                      }}
                      className="rounded p-0.5 text-foreground-muted/50 hover:text-foreground"
                      title={t('dashboard.renameFolder')}
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(folder.id)}
                      className="rounded p-0.5 text-foreground-muted/50 hover:text-red-600"
                      title={t('dashboard.deleteFolder')}
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Unfoldered */}
          <button
            onClick={() => onSelectFolder(activeFolder === '__unfoldered' ? null : '__unfoldered')}
            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
              activeFolder === '__unfoldered'
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
            }`}
          >
            <span className="italic">{t('dashboard.unfoldered')}</span>
          </button>
        </div>
      </div>

      {/* Tags cloud */}
      {allTags.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            {t('dashboard.tags')}
          </h3>
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag(tag)}
                className={`rounded-full px-2 py-0.5 text-[11px] transition-colors ${
                  activeTags.includes(tag)
                    ? 'bg-accent text-white'
                    : 'bg-background-secondary text-foreground-muted hover:text-foreground'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
