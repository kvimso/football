'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export interface SliderPlayer {
  id: string
  name: string
  position: string
  date_of_birth: string
  photo_url: string
  club?: { name: string } | null
}

const AUTO_ADVANCE_MS = 5000
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function calcAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function subscribeReducedMotion(callback: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}
function getReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}
function getReducedMotionServer(): boolean {
  return false
}

export function PlayerSlider({ players }: { players: SliderPlayer[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer
  )

  useEffect(() => {
    const onVisChange = () => setPaused(document.visibilityState !== 'visible')
    document.addEventListener('visibilitychange', onVisChange)
    return () => document.removeEventListener('visibilitychange', onVisChange)
  }, [])

  useEffect(() => {
    if (reducedMotion || paused || players.length <= 1) return
    const id = setInterval(() => {
      setActive((i) => (i + 1) % players.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [reducedMotion, paused, players.length])

  const next = useCallback(() => {
    setActive((i) => (i + 1) % players.length)
  }, [players.length])

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + players.length) % players.length)
  }, [players.length])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    }
  }

  if (players.length === 0) return null

  return (
    <>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured players"
        className="landing-slider"
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-live={paused || reducedMotion ? 'polite' : 'off'}
      >
        {players.map((p, i) => {
          const isActive = i === active
          const age = calcAge(p.date_of_birth)
          return (
            <div
              key={p.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${players.length}: ${p.name}`}
              aria-hidden={!isActive}
              inert={!isActive || undefined}
              className="landing-slide"
              style={{ opacity: isActive ? 1 : 0 }}
            >
              <Image
                src={p.photo_url}
                alt=""
                fill
                priority={i === 0}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                sizes="(max-width: 900px) 90vw, 440px"
                style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
              />
              <div className="landing-slide-gradient" aria-hidden="true" />
              <div className="landing-slide-info">
                <div className="landing-slide-name">{p.name}</div>
                <div className="landing-slide-meta">
                  {p.position} · {age} · {p.club?.name ?? 'Free Agent'}
                </div>
              </div>
            </div>
          )
        })}
        <div className="landing-slider-controls">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous player"
            className="landing-slider-ctrl"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            aria-pressed={paused}
            className="landing-slider-ctrl"
          >
            <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next player"
            className="landing-slider-ctrl"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <div className="landing-slider-dots" role="tablist" aria-label="Choose slide">
        {players.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Go to slide ${i + 1}: ${p.name}`}
            onClick={() => setActive(i)}
            className={`landing-slider-dot${i === active ? ' is-active' : ''}`}
          />
        ))}
      </div>
    </>
  )
}
