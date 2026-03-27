import { getServerT } from '@/lib/server-translations'

export async function Partners() {
  const { t } = await getServerT()

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-faint">
          {t('landing.partnersTitle')}
        </span>

        <div className="mt-5 flex items-center justify-center gap-10 sm:gap-16 opacity-50 transition-opacity hover:opacity-80">
          <span className="text-lg font-extrabold tracking-wide text-foreground sm:text-xl">
            FREE FOOTBALL AGENCY
          </span>
          <span className="text-xl font-extrabold tracking-wider text-foreground sm:text-2xl">
            STARLIVE
          </span>
        </div>
      </div>
    </section>
  )
}
