'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { removeFromShortlist, updateShortlistNote } from '@/app/actions/shortlist'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'

interface ShortlistItem {
  player_id: string | null
  notes: string | null
  created_at: string | null
  player: {
    id: string
    name: string
    name_ka: string
    slug: string
    position: string
    date_of_birth: string
    photo_url: string | null
    club: { name: string; name_ka: string } | null
  }
}

export function ShortlistList({ items: initialItems }: { items: ShortlistItem[] }) {
  const { t, lang } = useLang()
  const [items, setItems] = useState(initialItems)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl text-foreground-muted/30 mb-4">&#9734;</div>
        <p className="text-lg font-medium text-foreground-muted">{t('dashboard.noShortlist')}</p>
        <p className="mt-1 text-sm text-foreground-muted/70">{t('dashboard.noShortlistHint')}</p>
        <Link href="/players" className="btn-primary mt-4 text-sm">
          {t('home.browsePlayers')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">
        {t('dashboard.shortlist')} ({items.length})
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <ShortlistRow
            key={item.player_id}
            item={item}
            lang={lang}
            t={t}
            onRemove={() => setItems((prev) => prev.filter((i) => i.player_id !== item.player_id))}
          />
        ))}
      </div>
    </div>
  )
}

function ShortlistRow({
  item,
  lang,
  t,
  onRemove,
}: {
  item: ShortlistItem
  lang: string
  t: (key: string) => string
  onRemove: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(item.notes ?? '')
  const player = item.player
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = player.club ? (lang === 'ka' ? player.club.name_ka : player.club.name) : null
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-accent/20 text-accent'
  const age = calculateAge(player.date_of_birth)

  function handleRemove() {
    if (!item.player_id) return
    startTransition(async () => {
      await removeFromShortlist(item.player_id!)
      onRemove()
    })
  }

  function handleSaveNote() {
    if (!item.player_id) return
    startTransition(async () => {
      await updateShortlistNote(item.player_id!, noteText)
      setEditingNote(false)
    })
  }

  return (
    <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background border border-border text-lg font-bold text-foreground-muted/30">
          {player.photo_url ? (
            <Image src={player.photo_url} alt={player.name} fill className="rounded-lg object-cover" sizes="48px" />
          ) : (
            <PlayerSilhouette size="sm" className="text-foreground-muted/30" />
          )}
        </div>
        <div>
          <Link href={`/players/${player.slug}`} className="font-medium text-foreground hover:text-accent transition-colors">
            {displayName}
          </Link>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}>
              {player.position}
            </span>
            {clubName && <span>{clubName}</span>}
            <span>&middot;</span>
            <span>{age} {t('players.years')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        {/* Note */}
        {editingNote ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
              placeholder={t('dashboard.notesPlaceholder')}
            />
            <button onClick={handleSaveNote} disabled={isPending} className="text-xs text-accent hover:underline">
              {t('dashboard.saveNote')}
            </button>
            <button onClick={() => setEditingNote(false)} className="text-xs text-foreground-muted hover:underline">
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {item.notes ? (
              <span className="text-xs text-foreground-muted italic">&quot;{item.notes}&quot;</span>
            ) : null}
            <button onClick={() => setEditingNote(true)} className="text-xs text-accent hover:underline">
              {item.notes ? t('dashboard.editNote') : t('dashboard.addNote')}
            </button>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-xs text-red-400 hover:underline disabled:opacity-50"
        >
          {t('dashboard.removeFromShortlist')}
        </button>
      </div>
    </div>
  )
}
