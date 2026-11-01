
import { createContext } from 'react'

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthContextData {
  user: AuthUser | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

// Contexto compartilhado entre o provider e os componentes.
export const AuthContext = createContext<AuthContextData | undefined>(
  undefined,
)
