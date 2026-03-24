'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

const POLL_INTERVAL = 30_000 // 30 seconds

interface PendingPollingProps {
  userId: string
}

export function PendingPolling({ userId }: PendingPollingProps) {
  const { t } = useLang()
  const { signOut } = useAuth()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [approved, setApproved] = useState(false)

  // Refs for race condition protection
  const canceledRef = useRef(false)
  const isRedirectingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const routerRef = useRef(router)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Keep router ref stable
  useEffect(() => {
    routerRef.current = router
  }, [router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      canceledRef.current = true
      abortRef.current?.abort()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const checkApproval = useCallback(async () => {
    if (canceledRef.current || isRedirectingRef.current) return

    // Cancel previous in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('is_approved, role')
      .eq('id', userId)
      .abortSignal(abortRef.current.signal)
      .single()

    // Check guards after await
    if (canceledRef.current || isRedirectingRef.current) return

    // Error (missing profile, network, abort) — retry next cycle
    if (error) return

    if (data.is_approved) {
      isRedirectingRef.current = true
      setApproved(true)
      const destination =
        data.role === 'academy_admin'
          ? '/admin'
          : data.role === 'platform_admin'
            ? '/platform'
            : '/dashboard'
      routerRef.current.push(destination)
    }
  }, [userId])

  // Polling interval
  useEffect(() => {
    checkApproval()
    intervalRef.current = setInterval(checkApproval, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkApproval])

  // Re-check on tab focus + reset interval to prevent overlap
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !isRedirectingRef.current) {
        checkApproval()
        // Reset interval to prevent overlap
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(checkApproval, POLL_INTERVAL)
      }
    }

    const handleOnline = () => {
      if (!isRedirectingRef.current) checkApproval()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleOnline)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
    }
  }, [checkApproval])

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await signOut()
      router.push('/')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  if (approved) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          className="h-12 w-12 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-primary">{t('auth.approved')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      {/* Clock icon */}
      <svg
        className="h-16 w-16 text-foreground-muted/30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <h1 className="mt-6 text-xl font-semibold text-foreground">{t('auth.pendingTitle')}</h1>
      <p className="mt-3 max-w-md text-sm text-foreground-muted leading-relaxed">
        {t('auth.pendingDescription')}
      </p>
      <p className="mt-4 text-sm text-foreground-secondary">
        {t('auth.pendingContact')}{' '}
        <a href="mailto:info@gft.ge" className="font-medium text-primary hover:underline">
          info@gft.ge
        </a>
      </p>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-8 text-sm text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        {loggingOut ? t('common.loading') : t('nav.logout')}
      </button>
    </div>
  )
}
