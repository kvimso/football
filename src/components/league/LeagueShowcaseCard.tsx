import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import { BLUR_DATA_URL } from '@/lib/constants'
import type { Database } from '@/lib/database.types'

type League = Database['public']['Tables']['leagues']['Row']

export type CardVariant = 'hero' | 'warm' | 'green'

interface Props {
  league: League
  variant: CardVariant
}

/** Static fallback photos by age group — used when league has no photo_url */
const FALLBACK_PHOTOS: Record<string, string> = {
  U15: '/images/leagues/league-u15-v4.jpg',
  U17: '/images/leagues/league-u17.jpg',
  U19: '/images/leagues/league-u19.jpg',
}

/** Age-group identity colors — drives both the accent rule and the hover tint gradient */
const AGE_ACCENT: Record<string, string> = {
  U15: '#1B8A4A', // forest green
  U17: '#B87A08', // amber
  U19: '#2563EB', // blue
}
const DEFAULT_ACCENT = '#1B8A4A'

export async function LeagueShowcaseCard({ league, variant }: Props) {
  const { t, lang } = await getServerT()
  const displayName = lang === 'ka' ? league.name_ka : league.name
  const desc = lang === 'ka' ? league.description_ka : league.description
  const isValidUrl = league.starlive_url.startsWith('https://')
  const photoSrc = league.photo_url || FALLBACK_PHOTOS[league.age_group]
  const accent = AGE_ACCENT[league.age_group] ?? DEFAULT_ACCENT

  const Wrapper = isValidUrl ? 'a' : 'div'
  const linkProps = isValidUrl
    ? { href: league.starlive_url, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}

  if (variant === 'hero') {
    return (
      <Wrapper
        {...linkProps}
        className="league-showcase group relative flex min-h-[340px] flex-col justify-end sm:min-h-[400px]"
      >
        {/* Photo background */}
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt=""
            fill
            className="league-photo object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface to-elevated" />
        )}

        {/* Gradient overlay — light bottom fade for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

        {/* Color tint overlay — visible only on hover, driven by age group */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            backgroundImage: `linear-gradient(to top, ${accent}b3, ${accent}66, ${accent}26)`,
          }}
        />

        {/* Content — above gradient */}
        <div className="relative z-10 p-6 sm:p-8">
          <h3 className="text-xl font-extrabold text-white sm:text-2xl">{displayName}</h3>
          {desc && (
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75 line-clamp-2">
              {desc}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-white/60">
            <span className="font-bold uppercase tracking-widest" style={{ color: accent }}>
              {league.age_group}
            </span>
            <span>&middot;</span>
            <span>
              {t('leagues.season')}: {league.season}
            </span>
          </div>
          {isValidUrl && (
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-white">
              {t('leagues.viewOnStarlive')}
              <ExternalLinkIcon />
            </div>
          )}
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper
      {...linkProps}
      className="league-showcase group relative flex min-h-[220px] flex-col justify-end overflow-hidden"
    >
      {/* Photo background for all variants */}
      {photoSrc ? (
        <Image
          src={photoSrc}
          alt=""
          fill
          className="league-photo object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      ) : null}

      {/* Dark gradient overlay — light bottom fade for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent transition-opacity duration-300" />

      {/* Color tint overlay — visible only on hover, driven by age group */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: `linear-gradient(to top, ${accent}b3, ${accent}66, ${accent}26)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-5 sm:p-6">
        <h3 className="text-lg font-bold text-white">{displayName}</h3>
        {desc && (
          <p className="mt-1.5 text-sm leading-relaxed line-clamp-2 text-white/70">{desc}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
          <span className="font-bold uppercase tracking-widest" style={{ color: accent }}>
            {league.age_group}
          </span>
          <span>&middot;</span>
          <span>
            {t('leagues.season')}: {league.season}
          </span>
        </div>
        {isValidUrl && (
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-white">
            {t('leagues.viewOnStarlive')}
            <ExternalLinkIcon />
          </div>
        )}
      </div>
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
