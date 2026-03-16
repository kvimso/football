'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getUnreadCount,
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
} from '@/app/actions/notifications'
import { NotificationDropdown } from './NotificationDropdown'
import type { Notification } from '@/lib/notifications/types'

export function NotificationBell() {
  const { user, userRole } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const enabled = !!user && userRole !== 'platform_admin'

  // Poll unread count every 30s
  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const fetchCount = async () => {
      const count = await getUnreadCount()
      if (!cancelled) setUnreadCount(count)
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [enabled])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleToggle = useCallback(async () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen && !hasFetched) {
      setLoading(true)
      const data = await getRecentNotifications(20)
      setNotifications(data)
      setLoading(false)
      setHasFetched(true)
    }
  }, [open, hasFetched])

  const handleMarkRead = useCallback(async (id: string) => {
    await markAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [])

  if (!enabled) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center rounded-md p-1.5 text-foreground-muted transition-colors hover:text-foreground hover:bg-surface"
        aria-label="Notifications"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          loading={loading}
        />
      )}
    </div>
  )
}
