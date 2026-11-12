
import { createContext } from 'react'

export interface AuthUser {
  id: string
  name: string
  email: string
  isPlatformAdmin: boolean
  isPlatformManager: boolean
  canReviewExercises: boolean
}

export interface AuthContextData {
  user: AuthUser | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextData | undefined>(
  undefined,
)
