import { getServerT } from '@/lib/server-translations'

const TILES = [
  {
    titleKey: 'contact.tile0Title',
    descKey: 'contact.tile0Desc',
    linkKey: 'contact.tile0Link',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    titleKey: 'contact.tile1Title',
    descKey: 'contact.tile1Desc',
    linkKey: 'contact.tile1Link',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    titleKey: 'contact.tile2Title',
    descKey: 'contact.tile2Desc',
    linkKey: 'contact.tile2Link',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    titleKey: 'contact.tile3Title',
    descKey: 'contact.tile3Desc',
    linkKey: 'contact.tile3Link',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <path d="M10 6h8v4h-8z" />
      </svg>
    ),
  },
] as const

export async function ContactHelp() {
  const { t, lang } = await getServerT()
  const isKa = lang === 'ka'

  return (
    <section className="px-4 py-16 sm:py-24" style={{ contentVisibility: 'auto' }}>
      <div className="mx-auto max-w-[1200px]">
        {/* Centered header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2">
            <span className="inline-block h-[2px] w-5 bg-primary" />
          </div>
          <h2
            className={`text-[1.75rem] font-extrabold tracking-tight ${isKa ? 'font-sans' : ''}`}
            style={{
              ...(!isKa ? { fontFamily: 'var(--font-noto-serif, var(--font-sans))' } : {}),
              letterSpacing: '-0.02em',
            }}
          >
            {t('contact.helpHeading')}
          </h2>
          <p className="mt-3 text-sm text-foreground-secondary">{t('contact.helpSubtitle')}</p>
        </div>

        {/* 2×2 tile grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TILES.map((tile) => (
            <div
              key={tile.titleKey}
              className="flex gap-4 rounded-[14px] border bg-surface p-8 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
              style={{ borderColor: 'rgba(0,0,0,0.02)' }}
            >
              {/* Icon box */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary"
                style={{ background: 'rgba(27,138,74,0.08)' }}
              >
                {tile.icon}
              </div>
              {/* Text */}
              <div>
                <h3 className="text-[15px] font-bold text-foreground">{t(tile.titleKey)}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground-secondary">
                  {t(tile.descKey)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  {t(tile.linkKey)} <span aria-hidden="true">&rarr;</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Partner footer */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-center sm:gap-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-faint">
            {t('contact.partnersLabel')}
          </span>
          <div className="flex items-center gap-6 opacity-30" aria-hidden="true">
            <span className="text-sm font-bold tracking-wide text-foreground">STARLIVE</span>
            <span className="text-sm font-bold tracking-wide text-foreground">
              FREE FOOTBALL AGENCY
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
