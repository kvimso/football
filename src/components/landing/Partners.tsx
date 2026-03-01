import { getServerT } from '@/lib/server-translations'
import { CameraIcon } from '@/components/ui/Icons'

export async function Partners() {
  const { t } = await getServerT()

  return (
    <section className="py-16 sm:py-20 bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-block h-1 w-12 rounded-full bg-accent mb-4" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('landing.partnersTitle')}
          </h2>
          <p className="mt-4 text-foreground-muted leading-relaxed">
            {t('landing.partnersSubtitle')}
          </p>
        </div>

        {/* Single partner card — designed for easy logo drop-in */}
        <div className="mt-12 mx-auto max-w-lg">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <CameraIcon className="h-7 w-7 text-accent" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{t('landing.poweredBy')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              {t('landing.pixellotDesc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
