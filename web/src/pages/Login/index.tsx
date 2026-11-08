
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

  const inputClassName = [
    'w-full rounded-lg border border-border-default',
    'bg-page px-4 py-3 text-text-primary',
    'outline-none transition-colors duration-200',
    'focus:border-primary focus:ring-2 focus:ring-primary/20',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ].join(' ')

  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-[400px] gap-5 rounded-xl border border-border-default bg-surface p-6 shadow-lg sm:p-8"
      >
        <div className="mb-2">
          <h1 className="text-2xl leading-tight font-bold text-text-primary">
            Personal Trainer Manager
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Entre com sua conta de treinador.
          </p>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-text-primary"
          >
            E-mail
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            placeholder="seuemail@exemplo.com"
            required
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-text-primary"
          >
            Senha
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
            placeholder="Digite sua senha"
            required
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
