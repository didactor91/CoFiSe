import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAllNewsQuery, useProductsQuery, useReservationsQuery, useUsersQuery } from '../graphql/queries'
import { useCreateUserMutation, useDeleteUserMutation } from '../graphql/mutations'
import { UserRole, ReservationStatus } from '../graphql/generated-types'
import theme from '../theme'

interface StatCardProps {
  title: string
  value: number | string
  testId: string
}

function StatCard({ title, value, testId }: StatCardProps) {
  return (
    <div
      data-testid={testId}
      style={{
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        border: `1px solid ${theme.colors.border}`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: theme.colors.accent,
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          marginTop: theme.spacing.xs,
        }}
      >
        {title}
      </div>
    </div>
  )
}

export default function ControlPanel() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | null>(null)
  
  // User management state
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'STAFF' | 'ADMIN'>('STAFF')
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [newsResult] = useAllNewsQuery()
  const [productsResult] = useProductsQuery()
  const [reservationsResult] = useReservationsQuery({
    status: statusFilter || undefined,
  })
  const [usersResult] = useUsersQuery()

  const [, createUserMutation] = useCreateUserMutation()
  const [, deleteUserMutation] = useDeleteUserMutation()

  const news = newsResult.data?.allNews ?? []
  const products = productsResult.data?.products ?? []
  const reservations = reservationsResult.data?.reservations ?? []
  const users = usersResult.data?.users ?? []

  const pendingReservations = reservations.filter((r) => r.status === ReservationStatus.Pending)
    .length

  const isAdmin = user?.role === UserRole.Admin

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    
    try {
      const result = await createUserMutation({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      })
      
      if (result.error) {
        setCreateError(result.error.message)
        return
      }
      
      // Clear form on success
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('STAFF')
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear usuario')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setDeleteError(null)
    
    // Prevent self-delete
    if (userId === user?.id) {
      setDeleteError('No puedes eliminarte a ti mismo')
      return
    }
    
    try {
      const result = await deleteUserMutation({ id: userId })
      
      if (result.error) {
        setDeleteError(result.error.message)
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar usuario')
    }
  }

  return (
    <div
      data-testid="control-panel-page"
      style={{
        minHeight: '100vh',
        background: theme.colors.background,
        padding: theme.spacing.xl,
      }}
    >
      <h1
        style={{
          color: theme.colors.accent,
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.semibold,
          marginBottom: theme.spacing.xl,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        Panel de Control
      </h1>

      {/* Stats Dashboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing['2xl'],
        }}
      >
        <StatCard title="Noticias" value={news.length} testId="stat-news-count" />
        <StatCard
          title="Reservas Pendientes"
          value={pendingReservations}
          testId="stat-pending-reservations"
        />
        <StatCard title="Productos" value={products.length} testId="stat-product-count" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.xl }}>
        {/* Recent News Section */}
        <section>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
            }}
          >
            Noticias Recientes
          </h2>
          <div
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              overflow: 'hidden',
            }}
          >
            {news.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
                No hay noticias
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {news.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    style={{
                      padding: theme.spacing.md,
                      borderBottom: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text,
                    }}
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Recent Reservations Section */}
        <section>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
            }}
          >
            Reservas Recientes
          </h2>
          <div style={{ display: 'flex', gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
            <button
              data-testid="reservation-filter-pending"
              onClick={() => setStatusFilter(ReservationStatus.Pending)}
              style={{
                background: statusFilter === ReservationStatus.Pending ? theme.colors.accent : theme.colors.border,
                color: statusFilter === ReservationStatus.Pending ? theme.colors.background : theme.colors.text,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Pendientes
            </button>
            <button
              data-testid="reservation-filter-confirmed"
              onClick={() => setStatusFilter(ReservationStatus.Confirmed)}
              style={{
                background: statusFilter === ReservationStatus.Confirmed ? theme.colors.accent : theme.colors.border,
                color: statusFilter === ReservationStatus.Confirmed ? theme.colors.background : theme.colors.text,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setStatusFilter(null)}
              style={{
                background: statusFilter === null ? theme.colors.accent : theme.colors.border,
                color: statusFilter === null ? theme.colors.background : theme.colors.text,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Todas
            </button>
          </div>
          <div
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              overflow: 'hidden',
            }}
          >
            {reservations.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
                No hay reservas
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {reservations.slice(0, 5).map((reservation) => (
                  <li
                    key={reservation.id}
                    style={{
                      padding: theme.spacing.md,
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div style={{ color: theme.colors.text, fontWeight: theme.typography.fontWeight.medium }}>{reservation.name}</div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
                      {reservation.quantity}x {reservation.product.name} - {reservation.status}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* User Management Section - Admin Only */}
      {isAdmin && (
        <section data-testid="user-management-section" style={{ marginTop: theme.spacing['2xl'] }}>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
            }}
          >
            Gestión de Usuarios
          </h2>
          
          {/* Create User Form */}
          <form
            data-testid="create-user-form"
            onSubmit={handleCreateUser}
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              gap: theme.spacing.md,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Email
              </label>
              <input
                type="email"
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Contraseña"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Rol
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'STAFF' | 'ADMIN')}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: theme.colors.accent,
                color: theme.colors.background,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Crear Usuario
            </button>
          </form>
          
          {createError && (
            <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
              {createError}
            </p>
          )}
          
          {deleteError && (
            <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
              {deleteError}
            </p>
          )}

          {/* User List */}
          <div
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              overflow: 'hidden',
            }}
          >
            {users.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
                No hay usuarios
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {users.map((u) => (
                  <li
                    key={u.id}
                    style={{
                      padding: theme.spacing.md,
                      borderBottom: `1px solid ${theme.colors.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ color: theme.colors.text, fontWeight: theme.typography.fontWeight.medium }}>{u.email}</span>
                      <span
                        style={{
                          marginLeft: theme.spacing.sm,
                          padding: `${theme.spacing.xs} ${theme.spacing.xs}`,
                          background: u.role === 'ADMIN' ? theme.colors.accent : theme.colors.border,
                          color: u.role === 'ADMIN' ? theme.colors.background : theme.colors.text,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: theme.typography.fontSize.xs,
                          fontWeight: theme.typography.fontWeight.semibold,
                        }}
                      >
                        {u.role === 'ADMIN' ? 'Admin' : 'Staff'}
                      </span>
                    </div>
                    {u.id !== user?.id && (
                      <button
                        data-testid="delete-user-btn"
                        onClick={() => handleDeleteUser(u.id)}
                        style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          background: theme.colors.border,
                          color: theme.colors.text,
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.fontSize.xs,
                          fontWeight: theme.typography.fontWeight.semibold,
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
