import { getServerT } from '@/lib/server-translations'

interface TimelineEntry {
  years: string
  club: string
  isCurrent?: boolean
}

const KVARATSKHELIA_TIMELINE: TimelineEntry[] = [
  { years: '2017–2018', club: 'Dinamo Tbilisi' },
  { years: '2019', club: 'Rubin Kazan' },
  { years: '2022–2024', club: 'SSC Napoli' },
  { years: '2025–', club: 'Paris Saint-Germain', isCurrent: true },
]

const MAMARDASHVILI_TIMELINE: TimelineEntry[] = [
  { years: '2016–2019', club: 'Dinamo Tbilisi' },
  { years: '2019–2021', club: 'Locomotive Tbilisi' },
  { years: '2021–2025', club: 'Valencia CF' },
  { years: '2025–', club: 'Liverpool FC', isCurrent: true },
]

export async function SuccessStories() {
  const { t } = await getServerT()

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section heading with green underline bar */}
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t('landing.successTitle')}
          </h2>
          <div className="mt-2 h-1 w-10 rounded-full bg-primary" />
        </div>

        {/* Story cards grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <StoryCard
            name="Khvicha Kvaratskhelia"
            position="Left Winger"
            fee="€70M"
            timeline={KVARATSKHELIA_TIMELINE}
            gradientFrom="from-[#1a3a0a]"
            gradientVia="via-[#2d5a16]"
            gradientTo="to-[#1a3a0a]"
          />
          <StoryCard
            name="Giorgi Mamardashvili"
            position="Goalkeeper"
            fee="€30M"
            timeline={MAMARDASHVILI_TIMELINE}
            gradientFrom="from-[#3a0a0a]"
            gradientVia="via-[#6b1515]"
            gradientTo="to-[#3a0a0a]"
          />
        </div>
      </div>
    </section>
  )
}

interface StoryCardProps {
  name: string
  position: string
  fee: string
  timeline: TimelineEntry[]
  gradientFrom: string
  gradientVia: string
  gradientTo: string
}

function StoryCard({
  name,
  position,
  fee,
  timeline,
  gradientFrom,
  gradientVia,
  gradientTo,
}: StoryCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-lg hover:shadow-primary/5">
      {/* Photo area */}
      <div className="relative h-44 sm:h-52 overflow-hidden">
        {/* Gradient background (placeholder for real photo) */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} flex items-center justify-center`}
        >
          <div className="h-28 w-24 rounded-[45%_45%_0_0] bg-white/[0.07] mt-4 sm:h-32 sm:w-28" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

        {/* Info overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
          <div>
            <span className="text-base" role="img" aria-label="Georgian flag">
              &#127468;&#127466;
            </span>
            <div className="text-lg font-extrabold text-white sm:text-xl">{name}</div>
            <div className="text-xs text-white/70">{position}</div>
          </div>
          <div className="text-2xl font-black text-primary sm:text-3xl">{fee}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 sm:p-5">
        <div className="relative border-l-2 border-border pl-4">
          {timeline.map((entry) => (
            <div key={entry.years} className="relative pb-3 last:pb-0">
              {/* Timeline dot */}
              <div
                className={`absolute -left-[calc(0.5rem+1.5px)] top-1 h-2.5 w-2.5 rounded-full border-2 border-background ${
                  entry.isCurrent
                    ? 'bg-primary shadow-[0_0_0_3px_rgba(27,138,74,0.15)]'
                    : 'bg-foreground-faint'
                }`}
              />
              <div className="text-[11px] font-bold tracking-wider text-foreground-secondary">
                {entry.years}
              </div>
              <div
                className={`text-sm font-semibold ${
                  entry.isCurrent ? 'text-primary' : 'text-foreground'
                }`}
              >
                {entry.club}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
