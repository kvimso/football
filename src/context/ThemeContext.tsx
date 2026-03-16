'use client'

import { createContext, useState, useCallback, useMemo, useContext, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function setThemeCookie(theme: Theme) {
  document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax;Secure`
}

export function ThemeProvider({
  children,
  initialTheme = 'light',
}: {
  children: ReactNode
  initialTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    setThemeCookie(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    // Read from DOM, not React state — avoids stale closure bug with rapid toggles
    const current =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    const next: Theme = current === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }, [setTheme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
