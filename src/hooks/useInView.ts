'use client'

import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  /** IntersectionObserver threshold (0-1). Default: 0.1 */
  threshold?: number
  /** If true, skip animation when element is above the fold on mount. Default: true */
  skipAboveFold?: boolean
}

/**
 * One-shot IntersectionObserver hook with above-fold detection.
 * Returns { ref, isInView } — isInView becomes true once when element enters viewport.
 * Above-fold elements start as isInView = true (no flash).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(options: UseInViewOptions = {}) {
  const { threshold = 0.1, skipAboveFold = true } = options
  const ref = useRef<T>(null)
  // SSR: start visible to avoid hydration flash
  const [isInView, setIsInView] = useState(true)
  const hasTriggered = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || hasTriggered.current) return

    // Above the fold → keep visible, skip animation
    if (skipAboveFold) {
      const rect = el.getBoundingClientRect()
      if (rect.top >= 0 && rect.top < window.innerHeight) {
        hasTriggered.current = true
        return // already visible from SSR
      }
    }

    // Below the fold → hide (deferred to avoid sync setState in effect), then reveal on scroll
    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !cancelled) {
          hasTriggered.current = true
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    // Defer setState to rAF — below-fold elements aren't visible anyway
    requestAnimationFrame(() => {
      if (!cancelled) setIsInView(false)
    })
    observer.observe(el)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [threshold, skipAboveFold])

  return { ref, isInView }
}
