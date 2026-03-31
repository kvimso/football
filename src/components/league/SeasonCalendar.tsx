import { getServerT } from '@/lib/server-translations'
import { AGE_GROUP_COLOR_CLASSES } from '@/lib/constants'
import type { AgeGroup } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type League = Database['public']['Tables']['leagues']['Row']

interface Props {
  leagues: League[]
}

/**
 * Month names for the calendar axis.
 * Using short English labels (universal in sports contexts).
 */
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export async function SeasonCalendar({ leagues }: Props) {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  // Filter leagues that have both season_start and season_end
  const withDates = leagues.filter((l) => l.season_start && l.season_end)
  if (withDates.length === 0) return null

  // Derive data-driven axis range from actual league dates
  const starts = withDates.map((l) => new Date(l.season_start!))
  const ends = withDates.map((l) => new Date(l.season_end!))
  const rangeStart = new Date(Math.min(...starts.map((d) => d.getTime())))
  const rangeEnd = new Date(Math.max(...ends.map((d) => d.getTime())))

  // Generate month slots from rangeStart to rangeEnd (inclusive)
  const months: { year: number; month: number; label: string }[] = []
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  while (cursor <= rangeEnd) {
    months.push({
      year: cursor.getFullYear(),
      month: cursor.getMonth(),
      label: MONTH_LABELS[cursor.getMonth()],
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  // Calculate grid column span for each league bar
  function getBarColumns(start: string, end: string) {
    const s = new Date(start)
    const e = new Date(end)
    const startIdx =
      months.findIndex((m) => m.year === s.getFullYear() && m.month === s.getMonth()) + 1
    const endIdx =
      months.findIndex((m) => m.year === e.getFullYear() && m.month === e.getMonth()) + 2
    return { gridColumn: `${Math.max(startIdx, 1)} / ${Math.min(endIdx, months.length + 1)}` }
  }

  // Age group bar background colors (matching the badge bg tokens)
  const AGE_BAR_COLORS: Record<string, string> = {
    U13: 'bg-primary',
    U15: 'bg-pos-mid',
    U17: 'bg-pos-gk',
    U19: 'bg-pos-st',
    U21: 'bg-primary',
    Senior: 'bg-foreground-faint',
  }

  return (
    <section className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section heading */}
        <div className="text-center mb-10">
          <h2
            className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${isKa ? 'font-sans' : ''}`}
            style={!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined}
          >
            {t('leagues.calendar.title')}
          </h2>
          <p className="mt-2 text-sm text-foreground-secondary">{t('leagues.calendar.subtitle')}</p>
          <div className="mx-auto mt-3 h-[3px] w-12 rounded-full bg-primary" />
        </div>

        {/* Calendar grid — horizontally scrollable on mobile */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Month header row */}
            <div
              className="grid gap-px mb-3"
              style={{ gridTemplateColumns: `140px repeat(${months.length}, 1fr)` }}
            >
              <div /> {/* Label column spacer */}
              {months.map((m, i) => (
                <div
                  key={`${m.year}-${m.month}`}
                  className="text-center text-[10px] font-semibold uppercase tracking-wider text-foreground-faint"
                >
                  {m.label}
                  {(i === 0 || m.month === 0) && (
                    <span className="block text-[9px] text-foreground-faint/60">{m.year}</span>
                  )}
                </div>
              ))}
            </div>

            {/* League bars */}
            {withDates.map((league) => {
              const displayName = lang === 'ka' ? league.name_ka : league.name
              const ageClasses =
                AGE_GROUP_COLOR_CLASSES[league.age_group as AgeGroup] ??
                'bg-primary/10 text-primary'
              const barBg = AGE_BAR_COLORS[league.age_group] ?? 'bg-primary'
              const barStyle = getBarColumns(league.season_start!, league.season_end!)

              return (
                <div
                  key={league.id}
                  className="grid items-center gap-px mb-2"
                  style={{ gridTemplateColumns: `140px repeat(${months.length}, 1fr)` }}
                >
                  {/* League label */}
                  <div className="flex items-center gap-2 pr-3">
                    <span
                      className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${ageClasses}`}
                    >
                      {league.age_group}
                    </span>
                    <span className="truncate text-xs font-medium text-foreground">
                      {displayName}
                    </span>
                  </div>

                  {/* Bar — spans calculated columns */}
                  <div className={`calendar-bar ${barBg}`} style={barStyle}>
                    {league.season}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
