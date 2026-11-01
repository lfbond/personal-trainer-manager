
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'

import { useAuth } from '../../hooks/useAuth'

export function Login() {
  const { signIn, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/students" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('E-mail ou senha inválidos.')
      } else {
        setError('Não foi possível entrar. Verifique a conexão.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '1rem',
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 400,
        display: 'grid',
        gap: '1rem',
        padding: '2rem',
        background: '#fff',
        borderRadius: 12,
      }}>
        <h1>Personal Trainer Manager</h1>
        <p>Entre com sua conta de treinador.</p>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
