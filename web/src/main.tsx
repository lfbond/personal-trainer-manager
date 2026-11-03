import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/global.css'

import { AuthProvider } from './contexts/AuthContext'
import { ThemeContextProvider } from './contexts/ThemeContext'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeContextProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeContextProvider>
  </StrictMode>,
)
