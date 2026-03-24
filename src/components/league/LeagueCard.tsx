import { getServerT } from '@/lib/server-translations'
import { AGE_GROUP_COLOR_CLASSES } from '@/lib/constants'
import type { AgeGroup } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type League = Database['public']['Tables']['leagues']['Row']

interface LeagueCardProps {
  league: League
}

export async function LeagueCard({ league }: LeagueCardProps) {
  const { t, lang } = await getServerT()
  const displayName = lang === 'ka' ? league.name_ka : league.name
  const desc = lang === 'ka' ? league.description_ka : league.description
  const ageClasses =
    AGE_GROUP_COLOR_CLASSES[league.age_group as AgeGroup] ?? 'bg-primary/10 text-primary'
  const isValidUrl = league.starlive_url.startsWith('https://')

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ageClasses}`}
          >
            {league.age_group}
          </span>
          <h3 className="mt-2 text-base font-bold text-foreground group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {t('leagues.season')}: {league.season}
          </p>
        </div>
        {/* Trophy placeholder icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background border border-border">
          <svg
            className="h-6 w-6 text-primary/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m5.25-6.624a48.258 48.258 0 00-10.5 0"
            />
          </svg>
        </div>
      </div>
      {desc && (
        <p className="mt-3 line-clamp-2 text-xs text-foreground-muted leading-relaxed">{desc}</p>
      )}
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
        {t('leagues.viewOnStarlive')}
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
        <span className="sr-only">(opens in new tab)</span>
      </div>
    </>
  )

  if (isValidUrl) {
    return (
      <a
        href={league.starlive_url}
        target="_blank"
        rel="noopener noreferrer"
        className="card group block"
      >
        {content}
      </a>
    )
  }

  return <div className="card">{content}</div>
}
