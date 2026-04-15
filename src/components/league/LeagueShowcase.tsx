import { getServerT } from '@/lib/server-translations'
import { LeagueShowcaseCard } from '@/components/league/LeagueShowcaseCard'
import type { CardVariant } from '@/components/league/LeagueShowcaseCard'
import type { Database } from '@/lib/database.types'

type League = Database['public']['Tables']['leagues']['Row']

interface CardSlot {
  league: League
  variant: CardVariant
  span: 'full' | 'narrow' | 'wide'
}

/**
 * Pure function: determines layout and variant assignment for 1-N leagues.
 * - First league is always 'hero' (full-width)
 * - Remaining alternate 'warm' and 'green'
 * - For 3 leagues: hero (full) + row of 2 (narrow, wide)
 * - For 4+: hero + row of 2 + additional full-width cards
 */
export function computeLeagueLayout(leagues: League[]): CardSlot[] {
  if (leagues.length === 0) return []
  if (leagues.length === 1) {
    return [{ league: leagues[0], variant: 'hero', span: 'full' }]
  }

  const slots: CardSlot[] = [{ league: leagues[0], variant: 'hero', span: 'full' }]

  // Second row: up to 2 cards
  const remaining = leagues.slice(1)
  const secondRow = remaining.slice(0, 2)
  const rest = remaining.slice(2)

  secondRow.forEach((league, i) => {
    const variant: CardVariant = i % 2 === 0 ? 'warm' : 'green'
    const span = secondRow.length === 1 ? 'full' : i === 0 ? 'narrow' : 'wide'
    slots.push({ league, variant, span })
  })

  // Additional rows: alternate full-width
  rest.forEach((league, i) => {
    const variant: CardVariant = i % 2 === 0 ? 'green' : 'warm'
    slots.push({ league, variant, span: 'full' })
  })

  return slots
}

interface Props {
  leagues: League[]
}

export async function LeagueShowcase({ leagues }: Props) {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  if (leagues.length === 0) {
    return (
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-sm text-foreground-muted">{t('leagues.emptyState')}</p>
        </div>
      </section>
    )
  }

  const slots = computeLeagueLayout(leagues)
  const heroSlot = slots[0]
  const secondRow = slots.filter(
    (s) => s !== heroSlot && (s.span === 'narrow' || s.span === 'wide')
  )
  const restSlots = slots.filter((s) => s !== heroSlot && s.span === 'full')
  const season = leagues[0]?.season ?? ''

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section header — editorial split.
            Description copy assumes exactly three active Golden Leagues (U15/U17/U19).
            If coverage ever expands beyond three age groups, update the header copy. */}
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary">
              {t('leagues.showcase.header.eyebrow')}
            </span>
            <h2
              className={`mt-2 text-[26px] font-extrabold tracking-tight leading-[1.1] sm:text-3xl ${
                isKa ? 'font-sans' : ''
              }`}
              style={!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined}
            >
              {t('leagues.showcase.header.title')}
              <span className="text-primary italic">
                {t('leagues.showcase.header.titleAccent')}
              </span>
            </h2>
            <p className="mt-3 max-w-[540px] text-sm leading-relaxed text-foreground-secondary sm:text-base">
              {t('leagues.showcase.header.description')}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 sm:pb-1">
            <div className="text-xs font-bold uppercase tracking-wider text-primary">
              {leagues.length} {t('leagues.showcase.header.leaguesLabel')}
            </div>
            {season && (
              <div className="text-xs text-foreground-faint">
                {season} {t('leagues.showcase.header.seasonSuffix')}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Hero card — full width */}
          <LeagueShowcaseCard league={heroSlot.league} variant={heroSlot.variant} />

          {/* Second row — 5:7 split or single card */}
          {secondRow.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {secondRow.map((slot) => (
                <div
                  key={slot.league.id}
                  className={slot.span === 'narrow' ? 'md:col-span-5' : 'md:col-span-7'}
                >
                  <LeagueShowcaseCard league={slot.league} variant={slot.variant} />
                </div>
              ))}
            </div>
          )}

          {/* Additional full-width cards */}
          {restSlots.map((slot) => (
            <LeagueShowcaseCard key={slot.league.id} league={slot.league} variant={slot.variant} />
          ))}
        </div>
      </div>
    </section>
  )
}
