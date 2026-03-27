import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import type { FeaturedClub } from '@/app/(public)/page'

interface Props {
  clubs: FeaturedClub[]
}

export async function ClubLogoSlider({ clubs }: Props) {
  const { t, lang } = await getServerT()

  // Hide entirely if fewer than 3 clubs
  if (clubs.length < 3) return null

  // Duplicate for seamless infinite scroll
  const allClubs = [...clubs, ...clubs]

  return (
    <section className="bg-surface border-y border-border py-6 sm:py-8 overflow-hidden">
      <div className="text-center mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-faint">
          {t('landing.clubSliderLabel')}
        </span>
      </div>

      <div className="club-scroll-container group" aria-label={t('landing.clubSliderLabel')}>
        <div className="club-scroll-track">
          {allClubs.map((club, i) => {
            const isOriginal = i < clubs.length
            const name = lang === 'ka' && club.name_ka ? club.name_ka : club.name
            return (
              <div
                key={`${club.id}-${i}`}
                className="flex-shrink-0 flex items-center justify-center"
                aria-hidden={!isOriginal}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm sm:h-16 sm:w-16">
                  {club.logo_url ? (
                    <Image
                      src={club.logo_url}
                      alt={name}
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-full object-contain sm:h-12 sm:w-12"
                    />
                  ) : (
                    <span className="text-xs font-bold text-foreground-faint select-none">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
