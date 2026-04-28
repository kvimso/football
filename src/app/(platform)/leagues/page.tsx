import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leagues · Binocly',
  description:
    'Match data, video, and league pages live at Starlive — our partner camera and video network across Georgian football.',
}

// URLs are placeholders until Andria provides the real Starlive deep links
// (see Haveinmind.md). Override per environment via Vercel project env vars.
const FALLBACK_URL = 'https://starlive.com'

const LEAGUE_LINKS = [
  {
    id: 'u19' as const,
    title: 'U-19 Premier',
    subtitle: 'Top youth tier · 2025/26 season',
    accent: 'from-emerald-500/20 to-emerald-500/0',
    url: process.env.NEXT_PUBLIC_STARLIVE_LEAGUE_URL_1 ?? FALLBACK_URL,
  },
  {
    id: 'u17' as const,
    title: 'U-17 Premier',
    subtitle: 'Mid-youth tier · 2025/26 season',
    accent: 'from-amber-500/20 to-amber-500/0',
    url: process.env.NEXT_PUBLIC_STARLIVE_LEAGUE_URL_2 ?? FALLBACK_URL,
  },
  {
    id: 'u15' as const,
    title: 'U-15 Premier',
    subtitle: 'Entry youth tier · 2025/26 season',
    accent: 'from-sky-500/20 to-sky-500/0',
    url: process.env.NEXT_PUBLIC_STARLIVE_LEAGUE_URL_3 ?? FALLBACK_URL,
  },
] as const

export default function LeaguesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <header className="mb-12 max-w-3xl sm:mb-16">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-foreground-faint">
          Leagues
        </p>
        <h1 className="font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-5xl">
          Match data lives at Starlive.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
          Our partner Starlive runs the camera and video network across Georgian youth football.
          Live results, season tables, match footage, and player stats all live on their site — tap
          a league to open it in a new tab.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {LEAGUE_LINKS.map((league) => (
          <a
            key={league.id}
            href={league.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(20,16,10,0.06)]"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${league.accent} opacity-50 transition-opacity group-hover:opacity-100`}
              aria-hidden="true"
            />
            <div className="relative flex h-full flex-col">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground-faint">
                External · opens Starlive
              </p>
              <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground">
                {league.title}
              </h2>
              <p className="mt-2 text-sm text-foreground-secondary">{league.subtitle}</p>
              <div className="mt-auto flex items-center justify-between pt-10">
                <span className="text-sm font-medium text-foreground-secondary group-hover:text-primary">
                  Open
                </span>
                <svg
                  className="h-5 w-5 text-foreground-faint transition-all group-hover:translate-x-1 group-hover:text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 3h7v7M10 14L21 3M21 14v7h-7M3 10V3h7"
                  />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-12 max-w-xl text-sm text-foreground-faint">
        Want match data inside Binocly? It's coming.
      </p>
    </div>
  )
}
