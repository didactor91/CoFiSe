import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

/**
 * AdminLayout - Horizontal navbar + Outlet for admin page content
 * 
 * Provides navigation between admin sections and logout functionality.
 * Navbar links are permission-gated based on user's role.
 */
export default function AdminLayout() {
  const { logout, can } = useAuth()
  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'btn-primary text-center' : 'btn-secondary text-center'

  return (
    <div className="app-shell min-h-svh">
      <nav
        data-testid="admin-layout-nav"
        className="card mb-8"
      >
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">Panel de control</span>
          <button
            data-testid="logout-button"
            onClick={logout}
            className="btn-secondary"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <NavLink
            to="/admin"
            end
            className={navClass}
          >
            Dashboard
          </NavLink>

          {can('product.read') && (
            <NavLink
              to="/admin/products"
              className={navClass}
            >
              Productos
            </NavLink>
          )}

          {can('news.read') && (
            <NavLink
              to="/admin/news"
              className={navClass}
            >
              Noticias
            </NavLink>
          )}

          {can('event.read') && (
            <NavLink
              to="/admin/events"
              className={navClass}
            >
              Eventos
            </NavLink>
          )}

          {can('user.read') && (
            <NavLink
              to="/admin/users"
              className={navClass}
            >
              Usuarios
            </NavLink>
          )}
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
