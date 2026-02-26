import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'

export async function LandingHero() {
  const { t, lang } = await getServerT()

  // Split the hero title to highlight "Georgian" in light gold
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

          {/* Right — mock player card */}
          <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
            <div className="relative">
              {/* Gold gradient glow behind card */}
              <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-accent/20 via-accent/5 to-transparent blur-2xl" />

              {/* Card */}
              <div className="relative w-72 rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/30">
                {/* Position-colored top border (cyan for MID) */}
                <div className="h-1 bg-pos-mid" />

                {/* Card body */}
                <div className="p-6">
                  {/* Player silhouette */}
                  <div className="flex justify-center">
                    <div className="rounded-full bg-background-secondary p-4">
                      <PlayerSilhouette size="sm" className="h-20 w-20 text-foreground-muted/40" />
                    </div>
                  </div>

                  {/* Name & info */}
                  <div className="mt-4 text-center">
                    <div className="text-lg font-bold">
                      {lang === 'ka' ? 'გიორგი ბ.' : 'Giorgi B.'}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-2 text-sm text-foreground-muted">
                      <span className="inline-block h-2 w-2 rounded-full bg-pos-mid" />
                      <span>MF</span>
                      <span className="text-border">|</span>
                      <span>17 {lang === 'ka' ? 'წ.' : 'yrs'}</span>
                    </div>
                    <div className="mt-1 text-xs text-foreground-muted">
                      FC Dinamo Tbilisi
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-background/60 p-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-accent">12</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                        {lang === 'ka' ? 'გოლი' : 'Goals'}
                      </div>
                    </div>
                    <div className="text-center border-x border-border">
                      <div className="text-xl font-bold text-accent">8</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                        {lang === 'ka' ? 'ასის.' : 'Assists'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-accent">24</div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                        {lang === 'ka' ? 'მატჩი' : 'Matches'}
                      </div>
                    </div>
                  </div>

                  {/* Verified badge */}
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                    <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span>Verified Stats</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
