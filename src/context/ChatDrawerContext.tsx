'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ChatDrawerState {
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const ChatDrawerContext = createContext<ChatDrawerState | null>(null)

export function useChatDrawer(): ChatDrawerState {
  const ctx = useContext(ChatDrawerContext)
  if (ctx === null) {
    throw new Error('useChatDrawer must be used within ChatDrawerProvider')
  }
  return ctx
}

export function ChatDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const openDrawer = useCallback(() => setIsDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  return (
    <ChatDrawerContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer }}>
      {children}
    </ChatDrawerContext.Provider>
  )
}
