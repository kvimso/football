'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

interface AuthUser {
  id: string
  email?: string
}

interface AuthState {
  user: AuthUser | null
  userRole: UserRole | null
  isApproved: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  userRole: null,
  isApproved: false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({
  initialUser,
  initialRole,
  initialIsApproved,
  children,
}: {
  initialUser: AuthUser | null
  initialRole: UserRole | null
  initialIsApproved: boolean
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [userRole, setUserRole] = useState<UserRole | null>(initialRole)
  const [isApproved, setIsApproved] = useState(initialIsApproved)

  useEffect(() => {
    try {
      const supabase = createClient()
      let lastUserId: string | null = initialUser?.id ?? null

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        const newUser = session?.user
          ? { id: session.user.id, email: session.user.email ?? undefined }
          : null
        setUser(newUser)

        if (session?.user) {
          // Only re-fetch role when user ID changes, not on token refreshes
          if (session.user.id !== lastUserId) {
            lastUserId = session.user.id
            supabase
              .from('profiles')
              .select('role, is_approved')
              .eq('id', session.user.id)
              .single()
              .then(({ data, error }) => {
                if (!error) {
                  setUserRole((data?.role as UserRole) ?? null)
                  setIsApproved(data?.is_approved ?? false)
                }
              })
          }
        } else {
          lastUserId = null
          setUserRole(null)
          setIsApproved(false)
        }
      })

      return () => subscription.unsubscribe()
    } catch (err) {
      console.error('Failed to initialize Supabase auth listener:', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: initialUser is server-rendered once
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setIsApproved(false)
  }, [])

  const value = useMemo(
    () => ({ user, userRole, isApproved, signOut }),
    [user, userRole, isApproved, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
