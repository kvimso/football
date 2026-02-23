'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthUser {
  id: string
  email?: string
}

interface AuthState {
  user: AuthUser | null
  userRole: string | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({
  initialUser,
  initialRole,
  children,
}: {
  initialUser: AuthUser | null
  initialRole: string | null
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [userRole, setUserRole] = useState<string | null>(initialRole)
  const [isLoading] = useState(false)

  useEffect(() => {
    try {
      const supabase = createClient()

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const newUser = session?.user
          ? { id: session.user.id, email: session.user.email ?? undefined }
          : null
        setUser(newUser)

        if (session?.user) {
          supabase.from('profiles').select('role').eq('id', session.user.id).single()
            .then(({ data, error }) => {
              if (!error) setUserRole(data?.role ?? null)
            })
        } else {
          setUserRole(null)
        }
      })

      return () => subscription.unsubscribe()
    } catch {
      // Supabase client failed to initialize
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
