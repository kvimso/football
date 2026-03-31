import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import { AGE_GROUP_COLOR_CLASSES } from '@/lib/constants'
import { BLUR_DATA_URL } from '@/lib/constants'
import type { AgeGroup } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type League = Database['public']['Tables']['leagues']['Row']

export type CardVariant = 'hero' | 'warm' | 'green'

interface Props {
  league: League
  variant: CardVariant
}

export async function LeagueShowcaseCard({ league, variant }: Props) {
  const { t, lang } = await getServerT()
  const displayName = lang === 'ka' ? league.name_ka : league.name
  const desc = lang === 'ka' ? league.description_ka : league.description
  const ageClasses =
    AGE_GROUP_COLOR_CLASSES[league.age_group as AgeGroup] ?? 'bg-primary/10 text-primary'
  const isValidUrl = league.starlive_url.startsWith('https://')

  const Wrapper = isValidUrl ? 'a' : 'div'
  const linkProps = isValidUrl
    ? { href: league.starlive_url, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}

  if (variant === 'hero') {
    return (
      <Wrapper
        {...linkProps}
        className="league-showcase group relative flex min-h-[380px] flex-col justify-end"
      >
        {/* Photo background */}
        {league.photo_url ? (
          <Image
            src={league.photo_url}
            alt=""
            fill
            className="league-photo object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface to-elevated" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content — above gradient */}
        <div className="relative z-10 p-6 sm:p-8">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${ageClasses}`}
          >
            {league.age_group}
          </span>
          <h3 className="mt-3 text-xl font-extrabold text-white sm:text-2xl">{displayName}</h3>
          {desc && (
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70 line-clamp-2">
              {desc}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
            <span>
              {t('leagues.season')}: {league.season}
            </span>
            <span>&middot;</span>
            <span>{t('leagues.showcase.pixellotTracked')}</span>
          </div>
          {isValidUrl && (
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
              {t('leagues.viewOnStarlive')}
              <ExternalLinkIcon />
            </div>
          )}
        </div>
      </Wrapper>
    )
  }

  // Warm and Green variants
  const isGreen = variant === 'green'
  const bgClass = isGreen ? 'bg-primary-hover' : 'bg-surface'
  const textClass = isGreen ? 'text-white' : 'text-foreground'
  const subtextClass = isGreen ? 'text-white/70' : 'text-foreground-secondary'
  const linkClass = isGreen ? 'text-white font-medium' : 'text-primary font-medium'

  return (
    <Wrapper
      {...linkProps}
      className={`league-showcase group flex flex-col justify-between p-6 ${bgClass} border ${isGreen ? 'border-transparent' : 'border-border'}`}
    >
      <div>
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${ageClasses}`}
        >
          {league.age_group}
        </span>
        <h3 className={`mt-3 text-lg font-bold ${textClass}`}>{displayName}</h3>
        {desc && (
          <p className={`mt-2 text-sm leading-relaxed line-clamp-3 ${subtextClass}`}>{desc}</p>
        )}
        <div className={`mt-2 text-xs ${subtextClass}`}>
          {t('leagues.season')}: {league.season}
        </div>
      </div>
      {isValidUrl && (
        <div className={`mt-4 flex items-center gap-1 text-sm ${linkClass}`}>
          {t('leagues.viewOnStarlive')}
          <ExternalLinkIcon />
        </div>
      )}
    </Wrapper>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  )
}
