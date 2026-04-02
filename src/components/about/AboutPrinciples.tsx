import { getServerT } from '@/lib/server-translations'

const PRINCIPLES = [0, 1, 2] as const

export async function AboutPrinciples() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  return (
    <section className="py-10 sm:py-14" style={{ contentVisibility: 'auto' }}>
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid gap-12 border-t border-border pt-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Principles */}
          <div className="space-y-10">
            {PRINCIPLES.map((i) => (
              <div key={i} className="flex gap-5">
                <span
                  className="shrink-0 text-[3rem] font-black leading-none text-primary"
                  style={{ opacity: 0.3, width: 60 }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-[1.05rem] font-extrabold text-foreground">
                    {t(`about.principle${i}Title`)}
                  </h3>
                  <p className="mt-2 text-[0.875rem] leading-[1.65] text-foreground-secondary">
                    {t(`about.principle${i}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Quote card */}
          <div className="rounded-2xl bg-surface p-8 sm:p-10 lg:p-12">
            <div className="relative">
              {/* Large faded quote mark */}
              <span
                className="pointer-events-none absolute -left-3 -top-8 select-none font-serif text-[5rem] leading-none text-primary"
                style={{ opacity: 0.1 }}
                aria-hidden="true"
              >
                &ldquo;
              </span>

              <blockquote className="relative z-10">
                <p
                  className={`text-lg font-bold leading-[1.45] sm:text-xl ${isKa ? 'font-sans' : ''}`}
                  style={
                    !isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined
                  }
                >
                  <QuoteText t={t} />
                </p>
              </blockquote>

              {/* Green divider */}
              <div className="mt-6 h-[3px] w-10 rounded-full bg-primary" aria-hidden="true" />

              {/* Source */}
              <div className="mt-4">
                <p className="text-sm font-bold text-foreground">{t('about.quoteSource')}</p>
                <p className="mt-0.5 text-[0.8rem] text-foreground-faint">
                  {t('about.quoteSourceDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Renders quote text with green-highlighted keywords */
function QuoteText({ t }: { t: (key: string) => string }) {
  const full = t('about.quoteText')
  const highlights = [
    t('about.quoteHighlight1'),
    t('about.quoteHighlight2'),
    t('about.quoteHighlight3'),
  ]

  // Build regex that matches any highlight word
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'g')
  const parts = full.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        highlights.includes(part) ? (
          <span key={i} className="text-primary">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
