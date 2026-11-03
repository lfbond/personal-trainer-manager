import { useEffect, useState, type ReactNode} from 'react'

import { ThemeContext, type ThemePreference, type ResolvedTheme} from './theme-context'

const STORAGE_KEY = 'personal-trainer-theme'

function getStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (
      stored === 'light' ||
      stored === 'dark' ||
      stored === 'system'
    ) {
      return stored
    }
  } catch {
    // Utiliza a preferência do sistema se o armazenamento falhar.
  }

  return 'light'
}

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }

  return 'light'
}

export function ThemeContextProvider({
  children,
}: {
  children: ReactNode
}) {
  const [preference, setPreference] =
    useState<ThemePreference>(getStoredPreference)

  const [systemTheme, setSystemTheme] =
    useState<ResolvedTheme>(getSystemTheme)

  const resolvedTheme =
    preference === 'system' ? systemTheme : preference

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)',
    )

    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      resolvedTheme === 'dark',
    )

    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // A aplicação continua funcionando sem persistência.
    }
  }, [preference])

  return (
    <ThemeContext.Provider
      value={{
        preference,
        resolvedTheme,
        setPreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
