import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import theme from '../../theme'

/**
 * AdminLayout - Horizontal navbar + Outlet for admin page content
 * 
 * Provides navigation between admin sections and logout functionality.
 * Navbar links are permission-gated based on user's role.
 */
export default function AdminLayout() {
  const { logout, can } = useAuth()

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    background: isActive ? theme.colors.accent : 'transparent',
    color: isActive ? theme.colors.background : theme.colors.text,
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.sm,
    textDecoration: 'none',
    transition: 'all 0.2s',
  })

  const logoutButtonStyle = {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    background: theme.colors.border,
    color: theme.colors.text,
    border: 'none',
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.sm,
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background, padding: theme.spacing.xl }}>
      <nav
        data-testid="admin-layout-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing['2xl'],
          padding: theme.spacing.lg,
          background: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{
            color: theme.colors.accent,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
          }}>
            Panel de Control
          </span>
        </div>

        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          {/* Dashboard - all authenticated users */}
          <NavLink
            to="/admin"
            end
            style={navLinkStyle}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Dashboard
          </NavLink>

          {/* Products - product.read permission */}
          {can('product.read') && (
            <NavLink
              to="/admin/products"
              style={navLinkStyle}
            >
              Productos
            </NavLink>
          )}

          {/* News - news.read permission */}
          {can('news.read') && (
            <NavLink
              to="/admin/news"
              style={navLinkStyle}
            >
              Noticias
            </NavLink>
          )}

          {/* Events - event.read permission */}
          {can('event.read') && (
            <NavLink
              to="/admin/events"
              style={navLinkStyle}
            >
              Eventos
            </NavLink>
          )}

          {/* Users - user.read permission */}
          {can('user.read') && (
            <NavLink
              to="/admin/users"
              style={navLinkStyle}
            >
              Usuarios
            </NavLink>
          )}
        </div>

        <div>
          <button
            data-testid="logout-button"
            onClick={logout}
            style={logoutButtonStyle}
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  )
}