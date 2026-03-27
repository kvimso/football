'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleScoutApproval } from '@/app/actions/platform-scouts'
import { useLang } from '@/hooks/useLang'

interface ApprovalButtonProps {
  scoutId: string
  isApproved: boolean
}

export function ApprovalButton({ scoutId, isApproved }: ApprovalButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { t } = useLang()

  function handleClick() {
    startTransition(async () => {
      const result = await toggleScoutApproval(scoutId, !isApproved)
      if (result.success) router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs font-medium px-2 py-1 rounded ${
        isApproved ? 'text-danger hover:bg-danger/10' : 'text-primary hover:bg-primary/10'
      } disabled:opacity-50`}
    >
      {isPending
        ? t('common.loading')
        : isApproved
          ? t('platform.scouts.revoke')
          : t('platform.scouts.approve')}
    </button>
  )
}
