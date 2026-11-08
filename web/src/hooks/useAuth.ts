
import { useContext } from 'react'

import { AuthContext } from '../contexts/auth-context'

// Permite acessar a autenticação em qualquer componente
// que esteja dentro do AuthProvider.
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth deve ser utilizado dentro do AuthProvider.',
    )
  }

  return context
}
