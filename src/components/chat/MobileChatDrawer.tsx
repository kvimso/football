'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useChatDrawer } from '@/context/ChatDrawerContext'

interface MobileChatDrawerProps {
  children: React.ReactNode
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function MobileChatDrawer({ children }: MobileChatDrawerProps) {
  const { isDrawerOpen, closeDrawer } = useChatDrawer()
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Close drawer on navigation (conversation selected)
  useEffect(() => {
    closeDrawer()
  }, [pathname, closeDrawer])

  // Focus trap + keyboard handling
  useEffect(() => {
    if (!isDrawerOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const timer = requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      firstFocusable?.focus()
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer()
        return
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(timer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDrawerOpen, closeDrawer])

  useEffect(() => {
    if (!isDrawerOpen && previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isDrawerOpen])

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${isDrawerOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isDrawerOpen}
    >
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeDrawer}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Conversation list"
        className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-background shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0.24,1)] ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
