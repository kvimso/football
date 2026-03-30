'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import { useLang } from '@/hooks/useLang'
import type { FeaturedPlayer } from '@/app/(public)/page'

function getAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

interface Props {
  players: FeaturedPlayer[]
}

export function HeroPlayerSlider({ players }: Props) {
  const { t, lang } = useLang()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(((index % players.length) + players.length) % players.length)
    },
    [players.length]
  )

  // Auto-rotation
  useEffect(() => {
    if (players.length < 2 || isPaused || prefersReducedMotion.current) return
    const timer = setInterval(() => goTo(currentIndex + 1), 5000)
    return () => clearInterval(timer)
  }, [currentIndex, isPaused, goTo, players.length])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goTo(currentIndex - 1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goTo(currentIndex + 1)
      }
    },
    [currentIndex, goTo]
  )

  const player = players[currentIndex]
  if (!player) return null

  const age = getAge(player.date_of_birth)
  const clubName = lang === 'ka' && player.club?.name_ka ? player.club.name_ka : player.club?.name
  const playerName = lang === 'ka' ? player.name_ka : player.name

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={t('landing.heroBadge')}
      aria-roledescription="carousel"
      className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-b from-surface via-elevated to-foreground-faint/30 mx-auto lg:mx-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
    >
      {/* Player image / silhouette */}
      <div className="absolute inset-0">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={playerName}
            fill
            className="object-cover object-top"
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, 384px"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <PlayerSilhouette size="lg" className="text-foreground-faint/30" />
          </div>
        )}
      </div>

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Player info */}
      <div className="absolute inset-x-0 bottom-0 p-5 pb-3">
        <div className="text-lg font-bold text-white">{playerName}</div>
        <div className="mt-0.5 text-sm text-white/70">
          {player.position} · {age} · {clubName}
        </div>

        {/* Dot indicators */}
        {players.length > 1 && (
          <div
            role="tablist"
            aria-label="Slides"
            className="mt-3 flex items-center gap-1.5 justify-center"
          >
            {players.map((p, i) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Slide ${i + 1}`}
                tabIndex={i === currentIndex ? 0 : -1}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
