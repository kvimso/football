import { getServerT } from '@/lib/server-translations'
import { CameraIcon } from '@/components/ui/Icons'

export async function Partners() {
  const { t } = await getServerT()

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {t('landing.partnersTitle')}
          </h2>
          <p className="mt-2 text-sm text-foreground-secondary">{t('landing.partnersSubtitle')}</p>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
          {/* Pixellot */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CameraIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">{t('landing.poweredBy')}</div>
              <div className="text-xs text-foreground-muted">AI-powered sports cameras</div>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-border" />

          {/* Starlive */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">Starlive</div>
              <div className="text-xs text-foreground-muted">Official Pixellot reseller</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
