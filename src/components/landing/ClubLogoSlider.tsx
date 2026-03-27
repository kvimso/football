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

  return (
    <section className="bg-surface border-y border-border py-6 sm:py-8">
      <div className="text-center mb-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-faint">
          {t('landing.clubSliderLabel')}
        </span>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
          role="list"
          aria-label={t('landing.clubSliderLabel')}
        >
          {clubs.map((club) => {
            const name = lang === 'ka' && club.name_ka ? club.name_ka : club.name
            return (
              <div key={club.id} role="listitem" className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm border border-border-subtle sm:h-[72px] sm:w-[72px]">
                  {club.logo_url ? (
                    <Image
                      src={club.logo_url}
                      alt={name}
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-full object-contain sm:h-12 sm:w-12"
                    />
                  ) : (
                    <span className="text-sm font-bold text-foreground-faint select-none sm:text-base">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-foreground-faint sm:text-[11px]">
                  {name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
