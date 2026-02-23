import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'

export async function LandingHero() {
  const { t, lang } = await getServerT()

  // Split the hero title to highlight the key word in emerald
  const title = t('landing.heroTitle')
  const highlightWord = lang === 'ka' ? 'ქართული' : 'Georgian'
  const parts = title.split(highlightWord)

  return (
    <section className="relative overflow-hidden">
      {/* Pitch pattern background */}
      <div className="pitch-pattern absolute inset-0 opacity-40" />

      {/* Corner arc decoration — top-left */}
      <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full border border-accent/10 hidden lg:block" />
      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full border border-accent/[0.07] hidden lg:block" />

      {/* Corner arc decoration — bottom-right */}
      <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full border border-accent/10 hidden lg:block" />
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full border border-accent/[0.07] hidden lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              {parts.length > 1 ? (
                <>
                  {parts[0]}
                  <span className="text-accent">{highlightWord}</span>
                  {parts[1]}
                </>
              ) : (
                title
              )}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-foreground-muted sm:text-xl max-w-xl mx-auto lg:mx-0">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">
              <Link
                href="/register"
                className="btn-primary px-8 py-3.5 text-base font-semibold"
              >
                {t('landing.registerScout')}
              </Link>
              <Link
                href="/login"
                className="btn-secondary px-8 py-3.5 text-base font-semibold"
              >
                {t('landing.registerAcademy')}
              </Link>
            </div>
          </div>

          {/* Right — decorative pitch geometry */}
          <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
            <div className="relative h-80 w-80">
              {/* Outer circle */}
              <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
              {/* Middle circle */}
              <div className="absolute inset-8 rounded-full border border-accent/10" />
              {/* Inner circle */}
              <div className="absolute inset-20 rounded-full border border-accent/20" />
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-accent/30" />
              {/* Cross lines */}
              <div className="absolute top-0 left-1/2 h-full w-px bg-accent/[0.07]" />
              <div className="absolute top-1/2 left-0 w-full h-px bg-accent/[0.07]" />
              {/* Penalty arc */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-24 w-48 rounded-t-full border-t-2 border-x-2 border-accent/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
