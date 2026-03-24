'use client'

import { useState } from 'react'
import { toggleLeagueActive } from '@/app/actions/platform-leagues'

interface ToggleActiveButtonProps {
  leagueId: string
  isActive: boolean
}

export function ToggleActiveButton({ leagueId, isActive }: ToggleActiveButtonProps) {
  const [pending, setPending] = useState(false)

  async function handleToggle() {
    setPending(true)
    await toggleLeagueActive(leagueId, !isActive)
    setPending(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        isActive ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
      }`}
    >
      {isActive ? 'Yes' : 'No'}
    </button>
  )
}
