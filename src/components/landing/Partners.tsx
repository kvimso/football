import { getServerT } from '@/lib/server-translations'

export async function Partners() {
  const { t } = await getServerT()

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground-faint">
          {t('landing.partnersTitle')}
        </span>

        <div className="mt-6 flex items-center justify-center gap-6 sm:gap-10">
          <div className="flex-1 text-right">
            <span className="text-base font-extrabold tracking-wide text-foreground opacity-50 transition-opacity hover:opacity-80 sm:text-lg">
              FREE FOOTBALL AGENCY
            </span>
          </div>
          <div className="h-6 w-px bg-border flex-shrink-0" />
          <div className="flex-1 text-left">
            <span className="text-base font-extrabold tracking-wide text-foreground opacity-50 transition-opacity hover:opacity-80 sm:text-lg">
              STARLIVE
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
