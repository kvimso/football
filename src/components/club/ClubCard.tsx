import Link from 'next/link'
import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'

interface ClubCardProps {
  club: {
    slug: string
    name: string
    name_ka: string
    logo_url: string | null
    city: string | null
    region: string | null
    description: string | null
    description_ka: string | null
    player_count: number
  }
}

export async function ClubCard({ club }: ClubCardProps) {
  const { t, lang } = await getServerT()
  const displayName = lang === 'ka' ? club.name_ka : club.name
  const desc = lang === 'ka' ? club.description_ka : club.description

  return (
    <Link href={`/clubs/${club.slug}`} className="card group block">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background border border-border text-lg font-bold text-accent">
          {club.logo_url ? (
            <Image src={club.logo_url} alt={club.name} fill className="rounded-lg object-cover" sizes="48px" />
          ) : (
            club.name.charAt(0)
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
            {displayName}
          </h3>
          <div className="text-xs text-foreground-muted">
            {club.city}{club.city && club.region && club.city !== club.region ? `, ${club.region}` : ''}
            {' '}&middot;{' '}
            {club.player_count} {t('clubs.players')}
          </div>
        </div>
      </div>
      {desc && (
        <p className="mt-3 line-clamp-2 text-xs text-foreground-muted leading-relaxed">
          {desc}
        </p>
      )}
    </Link>
  )
}
