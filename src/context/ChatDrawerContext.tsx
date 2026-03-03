'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ChatDrawerState {
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

function devWarning(): never {
  throw new Error('useChatDrawer must be used within ChatDrawerProvider')
}

const ChatDrawerContext = createContext<ChatDrawerState>({
  isDrawerOpen: false,
  openDrawer: process.env.NODE_ENV === 'development' ? devWarning : () => {},
  closeDrawer: process.env.NODE_ENV === 'development' ? devWarning : () => {},
})

export function useChatDrawer() {
  return useContext(ChatDrawerContext)
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
