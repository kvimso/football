'use client'

import { type ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'

interface Props {
  children: ReactNode
  className?: string
  /** Stagger delay in ms (e.g., 0, 50, 100 for sequential sections) */
  delay?: number
}

export function FadeInOnScroll({ children, className = '', delay = 0 }: Props) {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 200ms ease-out ${delay}ms, transform 200ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
