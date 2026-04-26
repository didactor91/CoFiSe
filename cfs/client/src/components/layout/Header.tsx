import { Link } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()

  const email = user?.email ?? ''
  const displayEmail = email.length > 20 ? `${email.slice(0, 20)}…` : email

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-slate-900">
          CFS
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
            Inicio
          </Link>
          <Link to="/catalog" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
            Catálogo
          </Link>
        </nav>
      </div>

      {/* Auth State */}
      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <>
            <span className="hidden text-sm text-slate-600 sm:block">{displayEmail}</span>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link to="/login" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  )
}
