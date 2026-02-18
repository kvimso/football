'use client'

import { useLang } from '@/hooks/useLang'

interface ClubDetailClientProps {
  club: {
    name: string
    name_ka: string
    description: string | null
    description_ka: string | null
  }
}

export function ClubDetailClient({ club }: ClubDetailClientProps) {
  const { lang } = useLang()
  const displayName = lang === 'ka' ? club.name_ka : club.name
  const desc = lang === 'ka' ? club.description_ka : club.description

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
      {desc && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-muted">{desc}</p>
      )}
    </>
  )
}
