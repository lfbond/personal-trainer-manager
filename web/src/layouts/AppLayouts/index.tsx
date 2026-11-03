
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useTheme } from '../../hooks/useTheme'

const navigationClassName = ({
  isActive,
  }: {
    isActive: boolean
  }) =>
    [
      'block rounded-lg px-4 py-3 no-underline',
      'transition-all duration-200 ease-in-out',
      'focus-visible:outline-2 focus-visible:outline-offset-2',
      'focus-visible:outline-green-500',
      isActive
        ? '!bg-green-600 !text-white font-semibold shadow-sm'
        : '!text-gray-400 hover:!bg-gray-700 hover:!text-white',
    ].join(' ')

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const { preference, setPreference } = useTheme()

  function closeMenu() {
    setMenuOpen(false)
  }

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: '☀' },
    { value: 'dark', label: 'Escuro', icon: '☾' },
    { value: 'system', label: 'Sistema', icon: '▣' },
  ] as const

  return (
    <div className="flex min-h-screen min-w-0 flex-col md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="w-full shrink-0 self-start bg-gray-900 px-4 py-4 text-white md:min-h-screen md:px-6 md:py-8">
        <div className="flex items-center justify-between gap-3 md:block">
          <strong className="flex flex-col text-xl md:mb-12">
            Personal Trainer
            <span className="text-sm font-normal text-gray-400">
              Manager
            </span>
          </strong>

          <button
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-600 !bg-gray-800 !text-white transition-colors hover:!bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 md:hidden"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              {menuOpen ? '×' : '☰'}
            </span>
          </button>
        </div>

        <div className={`${menuOpen ? 'block' : 'hidden'} mt-4 md:mt-0 md:block`}>
          <nav
            id="main-navigation"
            aria-label="Navegação principal"
            className="flex flex-col gap-2"
          >
            <NavLink
              to="/"
              end
              className={navigationClassName}
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/students"
              className={navigationClassName}
              onClick={closeMenu}
            >
              Alunos
            </NavLink>

            <NavLink
              to="/exercises"
              className={navigationClassName}
              onClick={closeMenu}
            >
              Exercícios
            </NavLink>

            <NavLink
              to="/workouts"
              className={navigationClassName}
              onClick={closeMenu}
            >
              Treinos
            </NavLink>
          </nav>

          <div className="mt-8 border-t border-gray-700 pt-6">
            <p className="mb-3 text-xs font-semibold tracking-wider !text-gray-400">
              APARÊNCIA
            </p>

            <div
              role="group"
              aria-label="Selecionar aparência"
              className="grid grid-cols-3 gap-1 rounded-lg bg-gray-800 p-1"
            >
              {themeOptions.map((option) => {
                const selected = preference === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPreference(option.value)}
                    className={[
                      'flex min-h-12 min-w-0 flex-col items-center justify-center gap-1',
                      'rounded-md border-0 px-1 py-2 text-xs',
                      'transition-all duration-200 ease-in-out',
                      'focus-visible:outline-2 focus-visible:outline-offset-2',
                      'focus-visible:outline-green-500',
                      selected
                        ? '!bg-green-600 !text-white shadow-md ring-1 ring-green-400'
                        : '!bg-transparent !text-gray-400 hover:!bg-gray-600 hover:!text-white',
                    ].join(' ')}
                  >
                    <span aria-hidden="true" className="text-lg leading-none">
                      {option.icon}
                    </span>
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-page px-4 py-6 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
