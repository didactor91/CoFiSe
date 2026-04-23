import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAllNewsQuery, useProductsQuery, useReservationsQuery, useUsersQuery } from '../graphql/queries'
import { useCreateUserMutation, useDeleteUserMutation, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation, useCreateNewsMutation, useUpdateNewsMutation, useDeleteNewsMutation } from '../graphql/mutations'
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
  const { user, logout } = useAuth()
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | null>(null)
  
  // User management state
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'STAFF' | 'ADMIN'>('STAFF')
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Product management state
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productFormError, setProductFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: ''
  })

  // News management state
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingNews, setEditingNews] = useState<any>(null)
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '' })
  const [newsFormError, setNewsFormError] = useState<string | null>(null)
  const [newsDeleteConfirm, setNewsDeleteConfirm] = useState<string | null>(null)

  const [newsResult] = useAllNewsQuery()
  const [productsResult] = useProductsQuery()
  const [reservationsResult] = useReservationsQuery({
    status: statusFilter || undefined,
  })
  const [usersResult] = useUsersQuery()

  const [, createUserMutation] = useCreateUserMutation()
  const [, deleteUserMutation] = useDeleteUserMutation()
  const [, createProductMutation] = useCreateProductMutation()
  const [, updateProductMutation] = useUpdateProductMutation()
  const [, deleteProductMutation] = useDeleteProductMutation()
  const [, createNewsMutation] = useCreateNewsMutation()
  const [, updateNewsMutation] = useUpdateNewsMutation()
  const [, deleteNewsMutation] = useDeleteNewsMutation()

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

  // Product management handlers
  const handleAddProduct = () => {
    setEditingProduct(null)
    setProductForm({ name: '', description: '', price: '', stock: '', imageUrl: '' })
    setProductFormError(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || ''
    })
    setProductFormError(null)
    setShowProductForm(true)
  }

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductFormError(null)
    
    const price = parseFloat(productForm.price)
    const stock = parseInt(productForm.stock, 10)
    
    if (!productForm.name.trim()) {
      setProductFormError('El nombre es requerido')
      return
    }
    if (productForm.name.length > 500) {
      setProductFormError('El nombre debe tener 500 caracteres o menos')
      return
    }
    if (isNaN(price) || price <= 0) {
      setProductFormError('El precio debe ser mayor que 0')
      return
    }
    if (isNaN(stock) || stock < 0) {
      setProductFormError('El stock debe ser 0 o mayor')
      return
    }
    
    try {
      if (editingProduct) {
        const result = await updateProductMutation({
          id: editingProduct.id,
          input: {
            name: productForm.name,
            description: productForm.description,
            price,
            stock,
            imageUrl: productForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setProductFormError(result.error.message)
          return
        }
      } else {
        const result = await createProductMutation({
          input: {
            name: productForm.name,
            description: productForm.description,
            price,
            stock,
            imageUrl: productForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setProductFormError(result.error.message)
          return
        }
      }
      
      setShowProductForm(false)
      setEditingProduct(null)
      setProductForm({ name: '', description: '', price: '', stock: '', imageUrl: '' })
    } catch (err: any) {
      setProductFormError(err.message || 'Error al guardar el producto')
    }
  }

  const handleDeleteProductClick = (productId: string) => {
    setDeleteConfirm(productId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      const result = await deleteProductMutation({ id: deleteConfirm })
      if (result.error) {
        setProductFormError(result.error.message)
      }
    } catch (err: any) {
      setProductFormError(err.message || 'Error al eliminar el producto')
    }
    setDeleteConfirm(null)
  }

  const handleCancelDelete = () => {
    setDeleteConfirm(null)
  }

  // News management handlers
  const handleAddNews = () => {
    setEditingNews(null)
    setNewsForm({ title: '', content: '', imageUrl: '' })
    setNewsFormError(null)
    setShowNewsForm(true)
  }

  const handleEditNews = (news: any) => {
    setEditingNews(news)
    setNewsForm({
      title: news.title,
      content: news.content,
      imageUrl: news.imageUrl || ''
    })
    setNewsFormError(null)
    setShowNewsForm(true)
  }

  const handleNewsFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewsFormError(null)

    if (!newsForm.title.trim()) {
      setNewsFormError('El título es requerido')
      return
    }
    if (!newsForm.content.trim()) {
      setNewsFormError('El contenido es requerido')
      return
    }

    try {
      if (editingNews) {
        const result = await updateNewsMutation({
          id: editingNews.id,
          input: {
            title: newsForm.title,
            content: newsForm.content,
            imageUrl: newsForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setNewsFormError(result.error.message)
          return
        }
      } else {
        const result = await createNewsMutation({
          input: {
            title: newsForm.title,
            content: newsForm.content,
            imageUrl: newsForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setNewsFormError(result.error.message)
          return
        }
      }

      setShowNewsForm(false)
      setEditingNews(null)
      setNewsForm({ title: '', content: '', imageUrl: '' })
    } catch (err: any) {
      setNewsFormError(err.message || 'Error al guardar la noticia')
    }
  }

  const handleDeleteNewsClick = (newsId: string) => {
    setNewsDeleteConfirm(newsId)
  }

  const handleConfirmNewsDelete = async () => {
    if (!newsDeleteConfirm) return

    try {
      const result = await deleteNewsMutation({ id: newsDeleteConfirm })
      if (result.error) {
        setNewsFormError(result.error.message)
      }
    } catch (err: any) {
      setNewsFormError(err.message || 'Error al eliminar la noticia')
    }
    setNewsDeleteConfirm(null)
  }

  const handleCancelNewsDelete = () => {
    setNewsDeleteConfirm(null)
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
        <button
          data-testid="logout-button"
          onClick={logout}
          style={{
            marginLeft: theme.spacing.lg,
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            background: theme.colors.border,
            color: theme.colors.text,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          Cerrar Sesión
        </button>
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

      {/* Product Management Section - Staff+ (Admin sees it too) */}
      <section data-testid="product-management-section" style={{ marginTop: theme.spacing['2xl'] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Gestión de Productos
          </h2>
          <button
            onClick={handleAddProduct}
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
            Añadir Producto
          </button>
        </div>

        {/* Product Form Modal */}
        {showProductForm && (
          <form
            data-testid="product-form"
            onSubmit={handleProductFormSubmit}
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  maxLength={500}
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
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Precio (€) *
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
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
            </div>
            <div style={{ marginTop: theme.spacing.md }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Descripción *
              </label>
              <textarea
                placeholder="Descripción del producto"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Stock *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
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
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  URL de Imagen (opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
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
            </div>
            
            {productFormError && (
              <p style={{ color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
                {productFormError}
              </p>
            )}

            <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
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
                {editingProduct ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.border,
                  color: theme.colors.text,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div
            data-testid="delete-confirm-dialog"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.error}`,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <p style={{ color: theme.colors.text, marginBottom: theme.spacing.md }}>
              ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.error,
                  color: '#fff',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Eliminar
              </button>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.border,
                  color: theme.colors.text,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Product List Table */}
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden',
          }}
        >
          {products.length === 0 ? (
            <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
              No hay productos aún. Haz clic en 'Añadir Producto' para crear uno.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.colors.border }}>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Nombre</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Precio</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Stock</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'right', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                  >
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{product.name}</td>
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>€{product.price.toFixed(2)}</td>
                    <td
                      style={{
                        padding: theme.spacing.sm,
                        color: product.stock === 0 ? theme.colors.error : theme.colors.text,
                        fontWeight: product.stock === 0 ? theme.typography.fontWeight.bold : undefined
                      }}
                    >
                      {product.stock === 0 && '⚠️ '}{product.stock}
                    </td>
                    <td style={{ padding: theme.spacing.sm, textAlign: 'right' }}>
                      <button
                        data-testid={`edit-product-btn-${product.id}`}
                        onClick={() => handleEditProduct(product)}
                        style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          background: theme.colors.accent,
                          color: theme.colors.background,
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.fontSize.xs,
                          fontWeight: theme.typography.fontWeight.semibold,
                          marginRight: theme.spacing.xs,
                        }}
                      >
                        Editar
                      </button>
                      <button
                        data-testid={`delete-product-btn-${product.id}`}
                        onClick={() => handleDeleteProductClick(product.id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* News Management Section - Staff+ */}
      <section data-testid="news-management-section" style={{ marginTop: theme.spacing['2xl'] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Gestión de Noticias
          </h2>
          <button
            onClick={handleAddNews}
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
            Añadir Noticia
          </button>
        </div>

        {/* News Form Modal */}
        {showNewsForm && (
          <form
            data-testid="news-form"
            onSubmit={handleNewsFormSubmit}
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <div>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Título *
              </label>
              <input
                type="text"
                placeholder="Título de la noticia"
                value={newsForm.title}
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
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
            <div style={{ marginTop: theme.spacing.md }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Contenido *
              </label>
              <textarea
                placeholder="Contenido de la noticia"
                value={newsForm.content}
                onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                required
                rows={5}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ marginTop: theme.spacing.md }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                URL de Imagen (opcional)
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={newsForm.imageUrl}
                onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
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

            {newsFormError && (
              <p style={{ color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
                {newsFormError}
              </p>
            )}

            <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
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
                {editingNews ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => { setShowNewsForm(false); setEditingNews(null); }}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.border,
                  color: theme.colors.text,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Dialog */}
        {newsDeleteConfirm && (
          <div
            data-testid="news-delete-confirm-dialog"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.error}`,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <p style={{ color: theme.colors.text, marginBottom: theme.spacing.md }}>
              ¿Estás seguro de que quieres eliminar esta noticia? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <button
                onClick={handleConfirmNewsDelete}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.error,
                  color: '#fff',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Eliminar
              </button>
              <button
                onClick={handleCancelNewsDelete}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: theme.colors.border,
                  color: theme.colors.text,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* News List Table */}
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
              No hay noticias aún. Haz clic en 'Añadir Noticia' para crear una.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.colors.border }}>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Título</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Contenido</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Imagen</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'right', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                  >
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{item.title}</td>
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.text, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}
                    </td>
                    <td style={{ padding: theme.spacing.sm }}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: theme.borderRadius.sm }}
                        />
                      ) : (
                        <span style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Sin imagen</span>
                      )}
                    </td>
                    <td style={{ padding: theme.spacing.sm, textAlign: 'right' }}>
                      <button
                        data-testid={`edit-news-btn-${item.id}`}
                        onClick={() => handleEditNews(item)}
                        style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          background: theme.colors.accent,
                          color: theme.colors.background,
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.fontSize.xs,
                          fontWeight: theme.typography.fontWeight.semibold,
                          marginRight: theme.spacing.xs,
                        }}
                      >
                        Editar
                      </button>
                      <button
                        data-testid={`delete-news-btn-${item.id}`}
                        onClick={() => handleDeleteNewsClick(item.id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
