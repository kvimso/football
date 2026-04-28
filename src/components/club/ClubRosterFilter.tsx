'use client'

import { useTransition, useMemo } from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Database } from '@/lib/database.types'
import { POSITIONS, POSITION_COLOR_CLASSES } from '@/lib/constants'
import { ROSTER_AGE_GROUPS, computeAgeGroup } from '@/lib/utils'
import type { Position } from '@/lib/types'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'

type PlayerRow = Database['public']['Tables']['players']['Row']

export type RosterPlayer = Pick<
  PlayerRow,
  'id' | 'name' | 'slug' | 'position' | 'date_of_birth' | 'photo_url' | 'jersey_number' | 'status'
>

const AGE_PARAM = 'age'
const POS_PARAM = 'pos'

const isRosterAgeGroup = (v: string | null): v is (typeof ROSTER_AGE_GROUPS)[number] | 'all' =>
  v === null || v === 'all' || (ROSTER_AGE_GROUPS as readonly string[]).includes(v)

const isPosition = (v: string | null): v is Position | 'all' =>
  v === null || v === 'all' || (POSITIONS as readonly string[]).includes(v)

interface Props {
  players: RosterPlayer[]
}

export function ClubRosterFilter({ players }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const ageRaw = searchParams.get(AGE_PARAM)
  const posRaw = searchParams.get(POS_PARAM)
  const age = isRosterAgeGroup(ageRaw) ? (ageRaw ?? 'all') : 'all'
  const position = isPosition(posRaw) ? (posRaw ?? 'all') : 'all'

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    const qs = next.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  const filtered = useMemo(() => {
    return players
      .filter((p) => p.status !== 'free_agent')
      .filter((p) => {
        if (age !== 'all' && computeAgeGroup(p.date_of_birth) !== age) return false
        if (position !== 'all' && p.position !== position) return false
        return true
      })
      .sort((a, b) => {
        const ja = a.jersey_number ?? 999
        const jb = b.jersey_number ?? 999
        if (ja !== jb) return ja - jb
        return a.name.localeCompare(b.name)
      })
  }, [players, age, position])

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Roster
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            {filtered.length} {filtered.length === 1 ? 'player' : 'players'}
            {age !== 'all' || position !== 'all' ? ' shown' : ''}
          </p>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-x-6 gap-y-4">
        <FilterGroup label="Age">
          <FilterButton active={age === 'all'} onClick={() => setParam(AGE_PARAM, 'all')}>
            All
          </FilterButton>
          {ROSTER_AGE_GROUPS.map((g) => (
            <FilterButton key={g} active={age === g} onClick={() => setParam(AGE_PARAM, g)}>
              {g}
            </FilterButton>
          ))}
        </FilterGroup>
        <FilterGroup label="Position">
          <FilterButton active={position === 'all'} onClick={() => setParam(POS_PARAM, 'all')}>
            All
          </FilterButton>
          {POSITIONS.map((p) => (
            <FilterButton key={p} active={position === p} onClick={() => setParam(POS_PARAM, p)}>
              {p}
            </FilterButton>
          ))}
        </FilterGroup>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="font-serif text-lg text-foreground">No players match these filters.</p>
          <p className="mt-2 text-sm text-foreground-secondary">
            Try a wider age range or all positions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <RosterCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </section>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-faint">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-primary bg-primary text-btn-primary-text'
          : 'border-border bg-surface text-foreground-secondary hover:bg-elevated hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function RosterCard({ player }: { player: RosterPlayer }) {
  const positionClass =
    POSITION_COLOR_CLASSES[player.position as Position] ?? 'bg-elevated text-foreground-secondary'
  const ageGroup = computeAgeGroup(player.date_of_birth)

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-[3/4] w-full bg-elevated">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PlayerSilhouette className="h-2/3 w-2/3 text-primary/30" />
          </div>
        )}
        {player.jersey_number !== null && player.jersey_number !== undefined && (
          <span className="absolute left-2 top-2 rounded-md bg-background/85 px-1.5 py-0.5 font-serif text-sm font-semibold text-foreground backdrop-blur">
            #{player.jersey_number}
          </span>
        )}
        <span
          className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${positionClass}`}
        >
          {player.position}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-1 font-medium text-foreground">{player.name}</p>
        {ageGroup && <p className="mt-0.5 text-xs text-foreground-faint">{ageGroup}</p>}
      </div>
    </div>
  )
}
