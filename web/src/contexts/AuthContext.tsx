
import {useCallback, useEffect, useState, type ReactNode} from 'react'

import { api, setApiAccessToken } from '../lib/api'
import { AuthContext, type AuthUser} from './auth-context'

interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    setApiAccessToken(accessToken)
  }, [accessToken])

  async function signIn(email: string, password: string) {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    })

    setApiAccessToken(response.data.accessToken)
    setAccessToken(response.data.accessToken)
    setUser(response.data.user)
  }

  const signOut = useCallback(() => {
    setApiAccessToken(null)
    setAccessToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && accessToken),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
