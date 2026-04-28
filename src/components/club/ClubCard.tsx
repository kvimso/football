import Link from 'next/link'
import Image from 'next/image'
import { ClubSilhouette } from '@/components/ui/ClubSilhouette'
import type { Database } from '@/lib/database.types'

type ClubRow = Database['public']['Tables']['clubs']['Row']

export type ClubCardData = Pick<
  ClubRow,
  'slug' | 'name' | 'logo_url' | 'hero_photo_url' | 'city' | 'region' | 'description' | 'tier'
> & {
  player_count: number
}

interface ClubCardProps {
  club: ClubCardData
}

const cardBaseClasses =
  'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(20,16,10,0.06)]'

const featuredClasses =
  'border-l-[3px] border-l-[var(--accent-warm,#C9A35F)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-50 before:[background:linear-gradient(135deg,rgba(201,163,95,0.06),transparent_45%)]'

export function ClubCard({ club }: ClubCardProps) {
  const isFeatured = club.tier > 0
  const cityLine = [club.city, club.region]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(', ')

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className={`${cardBaseClasses} ${isFeatured ? featuredClasses : ''}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
          {club.logo_url ? (
            <Image
              src={club.logo_url}
              alt={`${club.name} logo`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <ClubSilhouette className="h-10 w-10 text-primary/40" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-serif text-lg leading-tight font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {club.name}
          </h3>
          {cityLine && <div className="mt-1 text-sm text-foreground-secondary">{cityLine}</div>}
        </div>
        <span className="shrink-0 rounded-full bg-elevated px-3 py-1 text-xs font-medium text-foreground-secondary">
          {club.player_count} {club.player_count === 1 ? 'player' : 'players'}
        </span>
      </div>

      {club.description && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground-secondary">
          {club.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-6">
        <span className="text-xs font-medium uppercase tracking-wider text-foreground-faint">
          View club
        </span>
        <svg
          className="h-4 w-4 text-foreground-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </Link>
  )
}
