import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAllNewsQuery, useProductsQuery, useReservationsQuery, useUsersQuery } from '../graphql/queries'
import { useCreateUserMutation, useDeleteUserMutation } from '../graphql/mutations'
import { UserRole, ReservationStatus } from '../../../packages/types/generated/graphql'

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
        background: '#141414',
        borderRadius: '8px',
        padding: '1.5rem',
        border: '1px solid #262626',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: '#d4af37',
          fontSize: '2rem',
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: '#a0a0a0',
          fontSize: '0.875rem',
          marginTop: '0.5rem',
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
        background: '#0a0a0a',
        padding: '2rem',
      }}
    >
      <h1
        style={{
          color: '#d4af37',
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '2rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Panel de Control
      </h1>

      {/* Stats Dashboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Recent News Section */}
        <section>
          <h2
            style={{
              color: '#f5f5f5',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            Noticias Recientes
          </h2>
          <div
            style={{
              background: '#141414',
              borderRadius: '8px',
              border: '1px solid #262626',
              overflow: 'hidden',
            }}
          >
            {news.length === 0 ? (
              <p style={{ color: '#a0a0a0', padding: '1rem', textAlign: 'center' }}>
                No hay noticias
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {news.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #262626',
                      color: '#f5f5f5',
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
              color: '#f5f5f5',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            Reservas Recientes
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              data-testid="reservation-filter-pending"
              onClick={() => setStatusFilter(ReservationStatus.Pending)}
              style={{
                background: statusFilter === ReservationStatus.Pending ? '#d4af37' : '#262626',
                color: statusFilter === ReservationStatus.Pending ? '#0a0a0a' : '#f5f5f5',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Pendientes
            </button>
            <button
              data-testid="reservation-filter-confirmed"
              onClick={() => setStatusFilter(ReservationStatus.Confirmed)}
              style={{
                background: statusFilter === ReservationStatus.Confirmed ? '#d4af37' : '#262626',
                color: statusFilter === ReservationStatus.Confirmed ? '#0a0a0a' : '#f5f5f5',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setStatusFilter(null)}
              style={{
                background: statusFilter === null ? '#d4af37' : '#262626',
                color: statusFilter === null ? '#0a0a0a' : '#f5f5f5',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Todas
            </button>
          </div>
          <div
            style={{
              background: '#141414',
              borderRadius: '8px',
              border: '1px solid #262626',
              overflow: 'hidden',
            }}
          >
            {reservations.length === 0 ? (
              <p style={{ color: '#a0a0a0', padding: '1rem', textAlign: 'center' }}>
                No hay reservas
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {reservations.slice(0, 5).map((reservation) => (
                  <li
                    key={reservation.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #262626',
                    }}
                  >
                    <div style={{ color: '#f5f5f5', fontWeight: 500 }}>{reservation.name}</div>
                    <div style={{ color: '#a0a0a0', fontSize: '0.875rem' }}>
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
        <section data-testid="user-management-section" style={{ marginTop: '3rem' }}>
          <h2
            style={{
              color: '#f5f5f5',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            Gestión de Usuarios
          </h2>
          
          {/* Create User Form */}
          <form
            data-testid="create-user-form"
            onSubmit={handleCreateUser}
            style={{
              background: '#141414',
              borderRadius: '8px',
              border: '1px solid #262626',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', color: '#a0a0a0', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
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
                  padding: '0.75rem',
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '4px',
                  color: '#f5f5f5',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', color: '#a0a0a0', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
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
                  padding: '0.75rem',
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '4px',
                  color: '#f5f5f5',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', color: '#a0a0a0', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                Rol
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'STAFF' | 'ADMIN')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '4px',
                  color: '#f5f5f5',
                  fontSize: '0.875rem',
                }}
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#d4af37',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Crear Usuario
            </button>
          </form>
          
          {createError && (
            <p style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {createError}
            </p>
          )}
          
          {deleteError && (
            <p style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {deleteError}
            </p>
          )}

          {/* User List */}
          <div
            style={{
              background: '#141414',
              borderRadius: '8px',
              border: '1px solid #262626',
              overflow: 'hidden',
            }}
          >
            {users.length === 0 ? (
              <p style={{ color: '#a0a0a0', padding: '1rem', textAlign: 'center' }}>
                No hay usuarios
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {users.map((u) => (
                  <li
                    key={u.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #262626',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ color: '#f5f5f5', fontWeight: 500 }}>{u.email}</span>
                      <span
                        style={{
                          marginLeft: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background: u.role === 'ADMIN' ? '#d4af37' : '#262626',
                          color: u.role === 'ADMIN' ? '#0a0a0a' : '#f5f5f5',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
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
                          padding: '0.5rem 1rem',
                          background: '#262626',
                          color: '#f5f5f5',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
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