'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useChatDrawer } from '@/context/ChatDrawerContext'

interface MobileChatDrawerProps {
  children: React.ReactNode
}

export function MobileChatDrawer({ children }: MobileChatDrawerProps) {
  const { isDrawerOpen, closeDrawer } = useChatDrawer()
  const pathname = usePathname()

  // Close drawer on navigation (conversation selected)
  useEffect(() => {
    closeDrawer()
  }, [pathname, closeDrawer])

  // Escape key closes drawer
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeDrawer()
  }, [closeDrawer])

  useEffect(() => {
    if (isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDrawerOpen, handleKeyDown])

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${isDrawerOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isDrawerOpen}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer panel */}
      <div
        className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-background shadow-xl transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
