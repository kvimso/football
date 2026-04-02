import { getServerT } from '@/lib/server-translations'

export async function ContactPartners() {
  const { t } = await getServerT()

  return (
    <section
      className="border-y border-border bg-surface/25 py-10 sm:py-12"
      style={{ contentVisibility: 'auto' }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-4 sm:flex-row sm:justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-faint">
          {t('contact.partnersLabel')}
        </span>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          {/* Starlive — circle icon + text */}
          <div
            className="flex items-center gap-2 opacity-45 transition-opacity hover:opacity-75"
            aria-hidden="true"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[10px] font-black text-background">
              SL
            </div>
            <span className="text-lg font-extrabold tracking-wide text-foreground">STARLIVE</span>
          </div>

          {/* Pixellot — italic bold text */}
          <div className="opacity-45 transition-opacity hover:opacity-75" aria-hidden="true">
            <span className="text-xl font-black italic tracking-tight text-foreground">
              PIXELLOT
            </span>
          </div>
        </div>

        {/* Spacer for centering on desktop */}
        <div className="hidden w-24 sm:block" />
      </div>
    </section>
  )
}
