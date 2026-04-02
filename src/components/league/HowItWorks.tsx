import { getServerT } from '@/lib/server-translations'

const STEPS = [
  {
    titleKey: 'leagues.howItWorks.step1Title',
    descKey: 'leagues.howItWorks.step1Desc',
    icon: (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="h-6 w-6 text-primary"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    titleKey: 'leagues.howItWorks.step2Title',
    descKey: 'leagues.howItWorks.step2Desc',
    icon: (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="h-6 w-6 text-primary"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    titleKey: 'leagues.howItWorks.step3Title',
    descKey: 'leagues.howItWorks.step3Desc',
    icon: (
      <svg
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className="h-6 w-6 text-primary"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
]

export async function HowItWorks() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Heading */}
        <div className="mb-14 text-center">
          <h2
            className={`text-[26px] font-extrabold tracking-tight sm:text-3xl ${isKa ? 'font-sans' : ''}`}
            style={!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : undefined}
          >
            {t('leagues.howItWorks.title')}
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-12 rounded-full bg-primary" />
        </div>

        {/* Steps with rail */}
        <div className="relative mx-auto max-w-[900px]">
          {/* Connecting gradient rail (desktop) */}
          <div
            className="absolute left-[10%] right-[10%] top-7 hidden h-[2px] sm:block"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, var(--primary) 20%, var(--primary) 80%, transparent 100%)',
              opacity: 0.3,
            }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {STEPS.map(({ titleKey, descKey, icon }) => (
              <div key={titleKey} className="relative z-[1] text-center">
                {/* Circle icon */}
                <div className="mx-auto mb-[18px] flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-background">
                  {icon}
                </div>
                <h3 className="text-base font-bold">{t(titleKey)}</h3>
                <p className="mx-auto mt-1.5 max-w-[210px] text-[13px] leading-relaxed text-foreground-secondary">
                  {t(descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
