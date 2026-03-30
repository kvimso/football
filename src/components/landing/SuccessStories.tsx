import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'

interface TimelineEntry {
  years: string
  club: string
  isCurrent?: boolean
}

interface Achievement {
  titleKey: string
  descKey: string
}

interface PlayerStory {
  name: string
  positionKey: string
  fee: string
  gradient: string
  photo: string
  photoPosition: string
  timeline: TimelineEntry[]
  achievements: Achievement[]
}

const STORIES: PlayerStory[] = [
  {
    name: 'Khvicha Kvaratskhelia',
    positionKey: 'landing.posLeftWinger',
    fee: '€70M',
    gradient: 'linear-gradient(135deg, #0D3B2E 0%, #1B8A4A 40%, #4ADE80 100%)',
    photo: '/images/landing/kvaratskhelia.jpg',
    photoPosition: '35% 20%',
    timeline: [
      { years: '2017 – 2018', club: 'Dinamo Tbilisi' },
      { years: '2019', club: 'Rubin Kazan' },
      { years: '2022 – 2024', club: 'SSC Napoli' },
      { years: '', club: 'Paris Saint-Germain', isCurrent: true },
    ],
    achievements: [
      { titleKey: 'landing.kvaraAch1Title', descKey: 'landing.kvaraAch1Desc' },
      { titleKey: 'landing.kvaraAch2Title', descKey: 'landing.kvaraAch2Desc' },
      { titleKey: 'landing.kvaraAch3Title', descKey: 'landing.kvaraAch3Desc' },
    ],
  },
  {
    name: 'Giorgi Mamardashvili',
    positionKey: 'landing.posGoalkeeper',
    fee: '€30M',
    gradient: 'linear-gradient(135deg, #5C1A1A 0%, #CC3333 40%, #F87171 100%)',
    photo: '/images/landing/mamardashvili.jpg',
    photoPosition: 'center 20%',
    timeline: [
      { years: '2016 – 2019', club: 'Dinamo Tbilisi' },
      { years: '2019 – 2021', club: 'Locomotive Tbilisi' },
      { years: '2021 – 2025', club: 'Valencia CF' },
      { years: '', club: 'Liverpool FC', isCurrent: true },
    ],
    achievements: [
      { titleKey: 'landing.mamaAch1Title', descKey: 'landing.mamaAch1Desc' },
      { titleKey: 'landing.mamaAch2Title', descKey: 'landing.mamaAch2Desc' },
      { titleKey: 'landing.mamaAch3Title', descKey: 'landing.mamaAch3Desc' },
    ],
  },
]

export async function SuccessStories() {
  const { t } = await getServerT()

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section heading — centered */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t('landing.successTitle')}
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-12 rounded-full bg-primary" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {STORIES.map((story) => (
            <StoryCard key={story.name} story={story} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StoryCard({ story, t }: { story: PlayerStory; t: (key: string) => string }) {
  const presentLabel = t('landing.successPresent')

  return (
    <div className="overflow-hidden rounded-2xl border border-elevated bg-background shadow-sm shadow-black/[0.04]">
      {/* Photo area — 200px */}
      <div className="relative h-[200px] overflow-hidden" style={{ background: story.gradient }}>
        <Image
          src={story.photo}
          alt={story.name}
          fill
          loading="lazy"
          className="object-cover"
          style={{ objectPosition: story.photoPosition }}
          sizes="(max-width: 768px) 100vw, 640px"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

        {/* Info overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5">
          <div>
            <div className="text-[1.15rem] font-bold text-white leading-tight">
              {story.name}{' '}
              <span role="img" aria-label="Georgian flag">
                &#127468;&#127466;
              </span>
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-white/75">
              {t(story.positionKey)}
            </div>
          </div>
          <div className="text-xl font-extrabold text-primary sm:text-2xl">{story.fee}</div>
        </div>
      </div>

      {/* Card body — two-column split */}
      <div className="grid grid-cols-2 gap-5 p-5">
        {/* Career Path */}
        <div className="flex flex-col">
          <h3 className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground-faint">
            {t('landing.successCareerPath')}
          </h3>
          <div className="flex flex-1 flex-col">
            {story.timeline.map((entry, i) => {
              const isFirst = i === 0
              const isLast = i === story.timeline.length - 1
              const yearLabel = entry.isCurrent ? `2025 – ${presentLabel}` : entry.years

              return (
                <div key={entry.club} className="flex items-start">
                  {/* Track column — dots + lines */}
                  <div className="relative w-5 min-w-[20px] shrink-0 self-stretch">
                    {/* Line up (connector from previous dot) */}
                    {!isFirst && (
                      <div className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-elevated" />
                    )}
                    {/* Dot */}
                    <div
                      className={`absolute left-1/2 top-[3px] z-[2] h-2.5 w-2.5 -translate-x-1/2 rounded-full ${
                        entry.isCurrent
                          ? 'border-2 border-primary bg-background shadow-[0_0_0_3px_rgba(27,138,74,0.15)]'
                          : 'border-2 border-foreground-faint bg-background'
                      }`}
                    />
                    {/* Line down (to next dot) */}
                    {!isLast && (
                      <div className="absolute left-1/2 top-2 bottom-0 z-[1] w-0.5 -translate-x-1/2 bg-elevated" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pl-2 ${isLast ? '' : 'pb-4'}`}>
                    <div className="text-[0.6rem] font-semibold uppercase tracking-wider leading-none mb-0.5 text-foreground-faint">
                      {yearLabel}
                    </div>
                    <div
                      className={`text-[0.8rem] font-semibold leading-snug ${
                        entry.isCurrent ? 'text-primary font-bold' : 'text-foreground'
                      }`}
                    >
                      {entry.club}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="flex flex-col">
          <h3 className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground-faint">
            {t('landing.successAchievements')}
          </h3>
          <div className="flex flex-1 flex-col justify-between gap-2">
            {story.achievements.map((ach) => (
              <div
                key={ach.titleKey}
                className="rounded-lg border-l-[3px] border-l-primary bg-surface px-2.5 py-2"
              >
                <div className="text-[0.7rem] font-bold leading-snug text-foreground">
                  {t(ach.titleKey)}
                </div>
                <div className="text-[0.6rem] font-medium leading-snug text-foreground-secondary">
                  {t(ach.descKey)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
