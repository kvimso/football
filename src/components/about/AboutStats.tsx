import { getServerT } from '@/lib/server-translations'

const STATS = [
  { numberKey: 'about.statsPlayersNumber', labelKey: 'about.statsPlayersLabel', accent: 'green' },
  {
    numberKey: 'about.statsTransfersNumber',
    labelKey: 'about.statsTransfersLabel',
    accent: 'green',
  },
  {
    numberKey: 'about.statsAcademiesNumber',
    labelKey: 'about.statsAcademiesLabel',
    accent: 'green',
  },
  { numberKey: 'about.statsPlatformsNumber', labelKey: 'about.statsPlatformsLabel', accent: 'red' },
] as const

export async function AboutStats() {
  const { t } = await getServerT()

  return (
    <section className="py-2">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="stats-strip grid grid-cols-2 sm:grid-cols-4">
          {STATS.map(({ numberKey, labelKey, accent }, i) => (
            <div
              key={numberKey}
              className="relative flex flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-10"
            >
              {/* Vertical divider (not on first item, desktop only) */}
              {i > 0 && (
                <div
                  className="absolute left-0 top-1/4 hidden h-1/2 w-px bg-border sm:block"
                  aria-hidden="true"
                />
              )}
              {/* Mobile: divider on 2nd and 4th items (right column) */}
              {i % 2 === 1 && (
                <div
                  className="absolute left-0 top-1/4 h-1/2 w-px bg-border sm:hidden"
                  aria-hidden="true"
                />
              )}

              <span
                className={`text-2xl font-black tracking-tight sm:text-[2.5rem] ${
                  accent === 'red' ? 'text-danger' : 'text-foreground'
                }`}
                style={{ letterSpacing: '-0.03em' }}
                aria-label={`${t(numberKey)} ${t(labelKey)}`}
              >
                {t(numberKey)}
              </span>
              <span className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-foreground-faint">
                {t(labelKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
