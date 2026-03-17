'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLang } from '@/hooks/useLang'

const SECTIONS = ['overview', 'stats', 'matches', 'history', 'videos'] as const
type SectionId = (typeof SECTIONS)[number]

function isSectionId(value: string): value is SectionId {
  return (SECTIONS as readonly string[]).includes(value)
}

interface ProfileSubNavProps {
  /** Hide sections that have no content (e.g., no videos, no match history) */
  hiddenSections?: SectionId[]
}

export function ProfileSubNav({ hiddenSections = [] }: ProfileSubNavProps) {
  const { t } = useLang()
  const [active, setActive] = useState<SectionId>('overview')

  // Memoize to prevent IntersectionObserver reconnection on every parent re-render
  const visibleSections = useMemo(
    () => SECTIONS.filter((id) => !hiddenSections.includes(id)),
    [hiddenSections]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Type guard instead of unsafe `as SectionId` cast
          if (entry.isIntersecting && isSectionId(entry.target.id)) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-97px 0px -60% 0px' }
      // -97px = navbar(48) + subnav(~49) = offset from top
      // -60% = fires when section enters top 40% of viewport
    )

    visibleSections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [visibleSections])

  function handleClick(id: SectionId) {
    const el = document.getElementById(id)
    if (!el) return
    const offset = 48 + 49 // navbar + subnav
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const labels: Record<SectionId, string> = {
    overview: t('players.navOverview'),
    stats: t('players.navStats'),
    matches: t('players.navMatches'),
    history: t('players.navHistory'),
    videos: t('players.navVideos'),
  }

  return (
    <nav
      className="sticky top-[48px] z-30 -mx-4 border-b border-border bg-background px-4"
      aria-label="Player profile sections"
    >
      <div className="flex gap-6 overflow-x-auto">
        {visibleSections.map((id) => (
          <button
            key={id}
            onClick={() => handleClick(id)}
            aria-current={active === id ? 'true' : undefined}
            className={`shrink-0 border-b-2 py-3 text-sm font-medium transition-colors ${
              active === id
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            {labels[id]}
          </button>
        ))}
      </div>
    </nav>
  )
}
