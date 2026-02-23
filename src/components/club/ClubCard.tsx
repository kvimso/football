import Link from 'next/link'
import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import { ClubSilhouette } from '@/components/ui/ClubSilhouette'

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
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-background border border-border">
          {club.logo_url ? (
            <Image src={club.logo_url} alt={club.name} fill className="rounded-xl object-cover" sizes="64px" />
          ) : (
            <ClubSilhouette className="h-10 w-10 text-accent/40" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-foreground group-hover:text-accent transition-colors">
            {displayName}
          </h3>
          <div className="mt-0.5 text-xs text-foreground-muted">
            {club.city}{club.city && club.region && club.city !== club.region ? `, ${club.region}` : ''}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
          {club.player_count} {t('clubs.players')}
        </span>
      </div>
      {desc && (
        <p className="mt-3 line-clamp-2 text-xs text-foreground-muted leading-relaxed">
          {desc}
        </p>
      )}
    </Link>
  )
}
