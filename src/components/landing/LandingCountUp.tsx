'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from '@/hooks/useInView'

interface Props {
  /** Raw numeric target (e.g., 37600) */
  target: number
  /** Suffix to append after count completes (e.g., "+") */
  suffix?: string
  /** Use locale-aware formatting (e.g., 37,600). Default: true */
  formatted?: boolean
  className?: string
}

export function LandingCountUp({ target, suffix = '', formatted = true, className }: Props) {
  const [display, setDisplay] = useState(target) // SSR: show final value
  const { ref, isInView } = useInView<HTMLSpanElement>({ threshold: 0.5, skipAboveFold: true })
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimatedRef.current) return
    hasAnimatedRef.current = true

    // Start count from 0.
    // Synchronous setState is intentional: resets counter before animation begins.
    const cancelToken = { canceled: false }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplay(0)
    const duration = 600 // Match CountUpStat + design spec
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

    return () => {
      cancelToken.canceled = true
    }
  }, [isInView, target])

  const formattedValue = formatted ? display.toLocaleString() : String(display)

  return (
    <span ref={ref} className={className}>
      {formattedValue}
      {suffix}
    </span>
  )
}
