import { getServerT } from '@/lib/server-translations'

/* SVG icons for each feature */
const ICONS = {
  search: (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5 text-primary"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  trending: (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5 text-primary"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  chat: (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5 text-primary"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  comparison: (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5"
      style={{ color: '#4ADE80' }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
}

/* Stat labels for radar chart */
const RADAR_LABELS = ['PAC', 'SHO', 'PAS', 'DEF', 'PHY', 'DRI']

/* Decorative radar chart SVG for comparison card */
function RadarChart() {
  const cx = 80,
    cy = 80,
    r = 60
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  })
  // 3 concentric rings
  const gridLines = [0.33, 0.66, 1].map((s) =>
    points.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s])
  )
  const toPath = (pts: number[][]) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + 'Z'

  // Player data polygons
  const p1 = [0.8, 0.6, 0.9, 0.5, 0.7, 0.85].map((s, i) => [
    cx + (points[i][0] - cx) * s,
    cy + (points[i][1] - cy) * s,
  ])
  const p2 = [0.5, 0.9, 0.6, 0.8, 0.4, 0.7].map((s, i) => [
    cx + (points[i][0] - cx) * s,
    cy + (points[i][1] - cy) * s,
  ])

  // Label positions (pushed slightly outside outermost ring)
  const labelPts = points.map(([x, y]) => [cx + (x - cx) * 1.22, cy + (y - cy) * 1.22])

  return (
    <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
      {/* 3 concentric hex rings */}
      {gridLines.map((g, i) => (
        <path key={i} d={toPath(g)} fill="none" stroke="rgba(238,236,232,0.08)" strokeWidth={1} />
      ))}
      {/* 3 axis lines through center */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={points[i][0]}
          y1={points[i][1]}
          x2={points[i + 3][0]}
          y2={points[i + 3][1]}
          stroke="rgba(238,236,232,0.06)"
          strokeWidth={1}
        />
      ))}
      {/* Vertex dots on outermost ring */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2} fill="rgba(238,236,232,0.15)" />
      ))}
      {/* Player 1 (green solid) */}
      <path d={toPath(p1)} fill="rgba(74,222,128,0.12)" stroke="#4ADE80" strokeWidth={1} />
      {/* Player 2 (blue dashed) */}
      <path
        d={toPath(p2)}
        fill="rgba(96,165,250,0.1)"
        stroke="#60A5FA"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      {/* Stat labels */}
      {labelPts.map(([x, y], i) => (
        <text
          key={i}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(238,236,232,0.35)"
          fontSize={7}
          fontWeight={600}
        >
          {RADAR_LABELS[i]}
        </text>
      ))}
    </svg>
  )
}

/* Search mockup visual for the search card */
function SearchMockup() {
  const pills = ['U17', 'Midfielder', 'Tbilisi', '170cm+']
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border border-border p-3"
      style={{ background: 'rgba(255,255,255,0.02)' }}
      aria-hidden="true"
    >
      {/* Search input */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-elevated/50 px-3 py-2">
        <svg
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          className="h-3.5 w-3.5 text-foreground-faint"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="text-[0.7rem] text-foreground-faint">Search players...</span>
      </div>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {pills.map((pill, i) => (
          <span
            key={pill}
            className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${
              i === 0 || i === 2
                ? 'bg-primary/15 text-primary'
                : 'bg-elevated/50 text-foreground-faint'
            }`}
          >
            {pill}
          </span>
        ))}
      </div>
    </div>
  )
}

const AUDIENCE_LABELS = ['Scouts', 'Scouts', 'Scouts & Academies', 'Scouts'] as const

const FEATURES = [
  { index: 0, icon: ICONS.search, span: 'large', variant: 'light' as const, mockup: true },
  { index: 1, icon: ICONS.trending, span: 'small', variant: 'light' as const, mockup: false },
  { index: 2, icon: ICONS.chat, span: 'small', variant: 'light' as const, mockup: false },
  { index: 3, icon: ICONS.comparison, span: 'large', variant: 'dark' as const, mockup: true },
]

export async function AboutFeatures() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  return (
    <section className="py-10 sm:py-14" style={{ contentVisibility: 'auto' }}>
      <div className="mx-auto max-w-[1200px] px-4">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2">
            <div className="h-[2px] w-5 bg-primary" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t('about.featuresLabel')}
            </span>
          </div>
          <h2
            className={`mt-4 text-2xl font-black sm:text-3xl lg:text-[2.25rem] ${isKa ? 'font-sans' : ''}`}
            style={!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined}
          >
            {t('about.featuresHeading')}
          </h2>
          <p className="mt-2 text-sm text-foreground-secondary">{t('about.featuresSubtitle')}</p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ index, icon, span, variant, mockup }) => {
            const isDark = variant === 'dark'
            const isLarge = span === 'large'

            return (
              <div
                key={index}
                className={`feature-card relative overflow-hidden rounded-2xl p-6 sm:p-7 ${
                  isLarge ? 'sm:col-span-2 lg:col-span-2' : ''
                } ${
                  isDark
                    ? 'feature-card-dark border border-[rgba(74,222,128,0.08)]'
                    : 'border border-border bg-surface'
                }`}
                style={
                  isDark ? { background: 'linear-gradient(155deg, #141310, #0A0908)' } : undefined
                }
              >
                {/* Decorative elements — dark card only */}
                {isDark && (
                  <>
                    {/* Top-right green gradient slice */}
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-[140px] w-[140px] rounded-full"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)',
                      }}
                      aria-hidden="true"
                    />
                    {/* Bottom-left blue glow orb */}
                    <div
                      className="pointer-events-none absolute -bottom-10 -left-10 h-[140px] w-[140px] rounded-full"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)',
                      }}
                      aria-hidden="true"
                    />
                  </>
                )}

                <div
                  className={`relative z-10 ${isLarge && mockup ? 'grid gap-6 lg:grid-cols-[1fr_200px]' : ''}`}
                >
                  <div>
                    {/* Dot + audience label */}
                    <div className="flex items-center gap-2">
                      <div
                        className="h-[5px] w-[5px] shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <span
                        className={`text-[0.65rem] font-bold uppercase tracking-widest ${
                          isDark ? 'text-[rgba(238,236,232,0.4)]' : 'text-foreground-faint'
                        }`}
                      >
                        {AUDIENCE_LABELS[index]}
                      </span>
                    </div>

                    {/* Icon */}
                    <div
                      className={`mt-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                        isDark ? 'bg-[rgba(74,222,128,0.1)]' : 'bg-primary/10'
                      }`}
                    >
                      {icon}
                    </div>

                    {/* Title with green underline */}
                    <h3
                      className={`mt-4 text-base font-bold ${isDark ? 'text-[#EEECE8]' : 'text-foreground'}`}
                    >
                      {t(`about.feature${index}Title`)}
                      <span
                        className="mt-1.5 block h-[2px] w-[50px]"
                        style={{
                          background: `linear-gradient(90deg, ${isDark ? '#4ADE80' : 'var(--primary)'} 0%, transparent 100%)`,
                          opacity: isDark ? 0.6 : 0.5,
                        }}
                        aria-hidden="true"
                      />
                    </h3>
                    <p
                      className={`mt-2 text-[0.85rem] leading-relaxed ${
                        isDark ? 'text-[rgba(238,236,232,0.55)]' : 'text-foreground-secondary'
                      }`}
                    >
                      {t(`about.feature${index}Desc`)}
                    </p>
                  </div>

                  {/* Visual mockup (large cards only, hidden on mobile) */}
                  {isLarge && mockup && (
                    <div className="hidden items-center justify-center lg:flex">
                      {isDark ? (
                        <div
                          className="flex h-[150px] w-[150px] items-center justify-center rounded-xl border"
                          style={{
                            background: 'rgba(74,222,128,0.02)',
                            borderColor: 'rgba(74,222,128,0.06)',
                          }}
                        >
                          <RadarChart />
                        </div>
                      ) : (
                        <SearchMockup />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
