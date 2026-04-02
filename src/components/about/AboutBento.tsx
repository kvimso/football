import Image from 'next/image'
import { getServerT } from '@/lib/server-translations'
import { BLUR_DATA_URL } from '@/lib/constants'

const PROBLEM_ITEMS = [0, 1, 2, 3] as const
const SOLUTION_ITEMS = [0, 1, 2, 3] as const

export async function AboutBento() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4">
        {/* Header row */}
        <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-[2px] w-5 bg-primary" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {t('about.bentoLabel')}
              </span>
            </div>
            <h2
              className={`mt-4 text-2xl font-black leading-tight sm:text-3xl lg:text-[2.75rem] ${isKa ? 'font-sans' : ''}`}
              style={!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined}
            >
              {t('about.bentoHeading')}
              <br />
              {t('about.bentoHeadingLine2')}
            </h2>
          </div>

          {/* Pull quote */}
          <blockquote className="max-w-[280px] border-l-2 border-primary pl-5">
            <p className="text-sm leading-relaxed text-foreground-secondary italic">
              {t('about.bentoPullQuote')}
            </p>
          </blockquote>
        </div>

        {/* Bento grid */}
        <div className="grid gap-5 lg:grid-cols-3 lg:grid-rows-2">
          {/* Card A: The Problem — spans 2 cols, row 1 */}
          <div className="card-dark relative overflow-hidden p-7 sm:p-8 lg:col-span-2">
            {/* Red glow orb */}
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-[250px] w-[250px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(204,51,51,0.06) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10">
              {/* Label */}
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden="true" />
                <span className="text-[0.7rem] font-bold uppercase tracking-widest text-danger">
                  {t('about.problemLabel')}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-extrabold sm:text-2xl" style={{ color: '#EEECE8' }}>
                {t('about.problemTitle')}
              </h3>
              <p className="mt-2 text-[0.85rem]" style={{ color: 'rgba(238,236,232,0.5)' }}>
                {t('about.problemSubtitle')}
              </p>

              {/* 2x2 pain points */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PROBLEM_ITEMS.map((i) => (
                  <div key={i} className="flex gap-3">
                    <div
                      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(204,51,51,0.12)' }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F87171"
                        strokeWidth={2.5}
                        className="h-3.5 w-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-[0.9rem] font-bold" style={{ color: '#EEECE8' }}>
                        {t(`about.problemItem${i}Title`)}
                      </h4>
                      <p
                        className="mt-0.5 text-[0.78rem] leading-relaxed"
                        style={{ color: 'rgba(238,236,232,0.55)' }}
                      >
                        {t(`about.problemItem${i}Desc`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card B: Image — spans 1 col, spans 2 rows */}
          <div className="relative overflow-hidden rounded-2xl lg:row-span-2">
            <div className="relative h-64 sm:h-80 lg:h-full">
              <Image
                src="/images/about/bento-camera.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(26,25,23,0.9) 0%, rgba(26,25,23,0.3) 50%, transparent 100%)',
                }}
                aria-hidden="true"
              />
              {/* Scan line effect */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(74,222,128,0.03) 3px, rgba(74,222,128,0.03) 4px)',
                }}
                aria-hidden="true"
              />
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-6">
              {/* Tag */}
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-primary/20 px-2.5 py-1">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-3.5 w-3.5 text-primary"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                  {t('about.bentoImageTag')}
                </span>
              </div>
              <p
                className="text-[0.8rem] leading-relaxed"
                style={{ color: 'rgba(238,236,232,0.85)' }}
              >
                {t('about.bentoImageDesc')}
              </p>
            </div>
          </div>

          {/* Card C: The Solution — spans 2 cols, row 2 */}
          <div className="card-solution relative overflow-hidden p-7 sm:p-8 lg:col-span-2">
            {/* Glow orbs */}
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 h-[300px] w-[300px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10">
              {/* Label */}
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: '#A7F3D0' }}
                  aria-hidden="true"
                />
                <span
                  className="text-[0.7rem] font-bold uppercase tracking-widest"
                  style={{ color: '#A7F3D0' }}
                >
                  {t('about.solutionLabel')}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-extrabold sm:text-2xl">
                {t('about.solutionTitle')}
              </h3>
              <p className="mt-2 text-[0.85rem]" style={{ color: 'rgba(167,243,208,0.7)' }}>
                {t('about.solutionSubtitle')}
              </p>

              {/* 2x2 solutions */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {SOLUTION_ITEMS.map((i) => (
                  <div key={i} className="flex gap-3">
                    <div
                      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: 'rgba(167,243,208,0.15)',
                        border: '1px solid rgba(167,243,208,0.2)',
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#A7F3D0"
                        strokeWidth={2.5}
                        className="h-3.5 w-3.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-[0.9rem] font-bold">
                        {t(`about.solutionItem${i}Title`)}
                      </h4>
                      <p
                        className="mt-0.5 text-[0.78rem] leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        {t(`about.solutionItem${i}Desc`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
