'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import type { FeaturedPlayer } from '@/components/landing/types'

interface Props {
  players: FeaturedPlayer[]
}

export function HeroPlayerSlider({ players }: Props) {
  const { lang, t } = useLang()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
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

  if (!players.length) return null

  const current = players[currentIndex]
  const age = calculateAge(current.date_of_birth)
  const clubName =
    lang === 'ka' && current.club?.name_ka ? current.club.name_ka : current.club?.name
  const playerName = lang === 'ka' ? current.name_ka : current.name

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t('landing.carouselLabel')}
      className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-elevated mx-auto lg:mx-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
    >
      {/* All player images stacked — opacity crossfade */}
      {players.map((player, i) => (
        <div
          key={player.id}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === currentIndex ? 1 : 0 }}
        >
          {player.photo_url && (
            <Image
              src={player.photo_url}
              alt={lang === 'ka' ? player.name_ka : player.name}
              fill
              className="object-cover object-[center_10%]"
              priority={i === 0}
              loading={i === 0 ? 'eager' : 'lazy'}
              sizes="(max-width: 768px) 100vw, 384px"
            />
          )}
        </div>
      ))}

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Player info — crossfades with slide */}
      <div className="absolute inset-x-0 bottom-0 p-5 pb-3">
        <div className="text-lg font-bold text-white">{playerName}</div>
        <div className="mt-0.5 text-sm text-white/70">
          {current.position} · {age} · {clubName}
        </div>

        {/* Dot indicators */}
        {players.length > 1 && (
          <div
            role="tablist"
            aria-label={t('landing.slidesLabel')}
            className="mt-3 flex items-center gap-1.5 justify-center"
          >
            {players.map((p, i) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`${t('landing.slideLabel')} ${i + 1}`}
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
