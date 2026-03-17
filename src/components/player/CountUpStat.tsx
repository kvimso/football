'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpStatProps {
  value: number | null
  label: string
  suffix?: string
  accent?: boolean
}

export function CountUpStat({ value, label, suffix = '', accent }: CountUpStatProps) {
  // SSR-safe: initial state matches server render (no 0 flash)
  const [display, setDisplay] = useState(value ?? 0)
  const hasAnimatedRef = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || value == null || hasAnimatedRef.current) return

    // Skip animation if already in viewport on mount (above the fold)
    // Initial state is already `value` via useState, so no setDisplay needed
    const rect = ref.current.getBoundingClientRect()
    if (rect.top >= 0 && rect.top < window.innerHeight) {
      hasAnimatedRef.current = true
      return
    }

    const cancelToken = { canceled: false }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !cancelToken.canceled) {
          hasAnimatedRef.current = true
          observer.disconnect()
          const target = value
          const duration = 600 // ms
          const start = performance.now()
          function animate(now: number) {
            if (cancelToken.canceled) return
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            setDisplay(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(ref.current)
    return () => {
      cancelToken.canceled = true
      observer.disconnect()
    }
  }, [value])

  if (value == null) return null

  return (
    <div ref={ref} aria-label={`${value}${suffix} ${label}`}>
      <div
        className={`text-2xl font-bold tabular-nums sm:text-4xl ${accent ? 'text-primary' : 'text-foreground'}`}
      >
        {display}
        {suffix}
      </div>
      <div className="mt-0.5 text-xs text-foreground-muted">{label}</div>
    </div>
  )
}
