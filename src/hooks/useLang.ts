'use client'

import { useContext } from 'react'
import { LanguageContext } from '@/context/LanguageContext'

export function useLang() {
  return useContext(LanguageContext)
}
