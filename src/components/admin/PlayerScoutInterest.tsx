'use client'

import { useState } from 'react'
import { COUNTRY_FLAGS } from '@/lib/constants'

interface DemandEntry {
  country: string
  view_count: number
}

interface PlayerScoutInterestProps {
  playerName: string
  demand: DemandEntry[]
  labels: {
    scoutInterest: string
    noInterest: string
    views: string
  }
}

export function PlayerScoutInterest({ playerName, demand, labels }: PlayerScoutInterestProps) {
  const [open, setOpen] = useState(false)
  const total = demand.reduce((sum, e) => sum + Number(e.view_count), 0)

  if (total === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
        title={`${labels.scoutInterest}: ${playerName}`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
        {total}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-card p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{labels.scoutInterest}</p>
          <div className="space-y-1.5">
            {demand.map((entry) => {
              const flag = COUNTRY_FLAGS[entry.country] ?? COUNTRY_FLAGS['Unknown'] ?? ''
              return (
                <div key={entry.country} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span>{flag}</span>
                    {entry.country}
                  </span>
                  <span className="text-foreground-muted">
                    {entry.view_count} {labels.views}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
