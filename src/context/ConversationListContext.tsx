'use client'

import { createContext, useContext } from 'react'
import type { ConversationItem } from '@/lib/types'

const ConversationListContext = createContext<ConversationItem[] | null>(null)

export function useConversations(): ConversationItem[] {
  const ctx = useContext(ConversationListContext)
  if (ctx === null) {
    throw new Error('useConversations must be used within ConversationListProvider')
  }
  return ctx
}

export { ConversationListContext }
