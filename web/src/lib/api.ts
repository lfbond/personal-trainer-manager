import axios from 'axios'

// Cliente HTTP utilizado pelo frontend para acessar o backend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  timeout: 10000,
})

// Configura ou remove o token JWT das requisições.
export function setApiAccessToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}
