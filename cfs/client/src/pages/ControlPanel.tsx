import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAllNewsQuery, useProductsQuery, useReservationsQuery, useUsersQuery, useAllEventsQuery } from '../graphql/queries'
import { useCreateUserMutation, useDeleteUserMutation, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation, useCreateNewsMutation, useUpdateNewsMutation, useDeleteNewsMutation, useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation, useCreateProductOptionMutation, useAddOptionValuesMutation, useUpdateOptionValueMutation, useDeleteProductOptionMutation, useDeleteOptionValueMutation } from '../graphql/mutations'
import { UserRole, ReservationStatus } from '../graphql/generated-types'
import theme from '../theme'
import type { Permission } from '../auth/permissions'

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
  const { user, logout, can } = useAuth()
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
    imageUrl: '',
    hasOptions: false,         // Whether this product has option selector
    optionLabel: '',           // Label for the option field (e.g., "Talla", "Color")
    optionValues: [] as { value: string, stock: number | null }[],  // Values with stock
  })

  // News management state
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingNews, setEditingNews] = useState<any>(null)
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '' })
  const [newsFormError, setNewsFormError] = useState<string | null>(null)
  const [newsDeleteConfirm, setNewsDeleteConfirm] = useState<string | null>(null)

  // Event management state
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [eventForm, setEventForm] = useState({ name: '', description: '', location: '', startTime: '', endTime: '' })
  const [eventFormError, setEventFormError] = useState<string | null>(null)
  const [eventDeleteConfirm, setEventDeleteConfirm] = useState<string | null>(null)

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
  const [eventsResult] = useAllEventsQuery()
  const [, createEventMutation] = useCreateEventMutation()
  const [, updateEventMutation] = useUpdateEventMutation()
  const [, deleteEventMutation] = useDeleteEventMutation()
  const [, createProductOptionMutation] = useCreateProductOptionMutation()
  const [, addOptionValuesMutation] = useAddOptionValuesMutation()
  const [, updateOptionValueMutation] = useUpdateOptionValueMutation()
  const [, deleteProductOptionMutation] = useDeleteProductOptionMutation()
  const [, deleteOptionValueMutation] = useDeleteOptionValueMutation()

  const news = newsResult.data?.allNews ?? []
  const events = eventsResult.data?.allEvents ?? []
  const products = productsResult.data?.products ?? []
  const reservations = reservationsResult.data?.reservations ?? []
  const users = usersResult.data?.users ?? []

  const pendingReservations = reservations.filter((r) => r.status === ReservationStatus.Pending)
    .length

  // Permission checks (using the new permission system)
  const canManageUsers = can('user.create') && can('user.delete')
  const canCreateProduct = can('product.create')
  const canEditProduct = can('product.update')
  const canDeleteProduct = can('product.delete')
  const canCreateNews = can('news.create')
  const canEditNews = can('news.update')
  const canDeleteNews = can('news.delete')
  const canCreateEvent = can('event.create')
  const canEditEvent = can('event.update')
  const canDeleteEvent = can('event.delete')

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
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      imageUrl: '',
      hasOptions: false,
      optionLabel: '',
      optionValues: [],
    })
    setProductFormError(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (product: any) => {
    // Build optionValues from existing options if present
    let optionValues: { value: string; stock: number | null }[] = []
    let hasOptions = false
    let optionLabel = ''
    
    if (product.options && product.options.length > 0) {
      const opt = product.options[0]
      hasOptions = true
      optionLabel = opt.name
      optionValues = opt.values.map((v: any) => ({ value: v.value, stock: v.stock }))
    }
    
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || '',
      hasOptions,
      optionLabel,
      optionValues,
    })
    setProductFormError(null)
    setShowProductForm(true)
  }

  // Option value management within product form
  const handleToggleHasOptions = () => {
    setProductForm(prev => ({
      ...prev,
      hasOptions: !prev.hasOptions,
      // Reset option fields when disabling
      optionValues: !prev.hasOptions ? prev.optionValues : [],
      optionLabel: !prev.hasOptions ? prev.optionLabel : '',
    }))
  }

  const handleOptionLabelChange = (label: string) => {
    setProductForm(prev => ({ ...prev, optionLabel: label }))
  }

  const handleAddOptionValue = () => {
    setProductForm(prev => ({
      ...prev,
      optionValues: [...prev.optionValues, { value: '', stock: null }],
    }))
  }

  const handleOptionValueChange = (index: number, field: 'value' | 'stock', rawVal: string) => {
    setProductForm(prev => {
      const newValues = [...prev.optionValues]
      if (field === 'value') {
        newValues[index] = { ...newValues[index], value: rawVal }
      } else {
        // stock: empty string = null (infinite), number = finite
        newValues[index] = { ...newValues[index], stock: rawVal === '' ? null : parseInt(rawVal, 10) || 0 }
      }
      return { ...prev, optionValues: newValues }
    })
  }

  const handleRemoveOptionValue = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      optionValues: prev.optionValues.filter((_, i) => i !== index),
    }))
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
    if (productForm.hasOptions) {
      // Validate options
      if (!productForm.optionLabel.trim()) {
        setProductFormError('La etiqueta de la opción es requerida (ej: Talla, Color)')
        return
      }
      if (productForm.optionValues.length === 0) {
        setProductFormError('Debes añadir al menos un valor para la opción')
        return
      }
      for (const ov of productForm.optionValues) {
        if (!ov.value.trim()) {
          setProductFormError('Todos los valores deben tener texto')
          return
        }
      }
    } else {
      // No options - stock must be >= 0
      if (isNaN(stock) || stock < 0) {
        setProductFormError('El stock debe ser 0 o mayor')
        return
      }
    }
    
    try {
      if (editingProduct) {
        const result = await updateProductMutation({
          id: editingProduct.id,
          input: {
            name: productForm.name,
            description: productForm.description,
            price,
            stock: productForm.hasOptions ? 0 : stock, // If has options, stock derived from option values
            imageUrl: productForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setProductFormError(result.error.message)
          return
        }
        
        // Handle options update (delete existing and create new if changed)
        if (productForm.hasOptions && productForm.optionValues.length > 0) {
          // Delete existing option if any
          if (editingProduct.options && editingProduct.options.length > 0) {
            await deleteProductOptionMutation({ id: editingProduct.options[0].id })
          }
          // Create new option
          // Infer type from label (default to SIZE, detect COLOR if label contains "color")
        
        const optResult = await createProductOptionMutation({
          input: {
            productId: editingProduct.id,
            name: productForm.optionLabel,
            required: true,
          }
        })
          if (optResult.error) {
            setProductFormError(optResult.error.message)
            return
          }
          const optionId = (optResult.data as any)?.createProductOption?.id
          if (optionId) {
            await addOptionValuesMutation({
              optionId,
              values: productForm.optionValues.map(ov => ({ value: ov.value, stock: ov.stock })),
            })
          }
        } else if (!productForm.hasOptions && editingProduct.options && editingProduct.options.length > 0) {
          // Remove existing options
          await deleteProductOptionMutation({ id: editingProduct.options[0].id })
        }
      } else {
        const result = await createProductMutation({
          input: {
            name: productForm.name,
            description: productForm.description,
            price,
            stock: productForm.hasOptions ? 0 : stock,
            imageUrl: productForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setProductFormError(result.error.message)
          return
        }
        
        // Create options if specified
        if (productForm.hasOptions && productForm.optionValues.length > 0) {
          const productId = (result.data as any)?.createProduct?.id
          if (productId) {
            const optResult = await createProductOptionMutation({
              input: {
                productId,
                name: productForm.optionLabel,
                required: true,
              }
            })
            if (optResult.error) {
              setProductFormError(optResult.error.message)
              return
            }
            const optionId = (optResult.data as any)?.createProductOption?.id
            if (optionId) {
              await addOptionValuesMutation({
                optionId,
                values: productForm.optionValues.map(ov => ({ value: ov.value, stock: ov.stock })),
              })
            }
          }
        }
      }
      
      setShowProductForm(false)
      setEditingProduct(null)
      setProductForm({
        name: '',
        description: '',
        price: '',
        stock: '',
        imageUrl: '',
        hasOptions: false,
        optionLabel: '',
        optionValues: [],
      })
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

  // Product Option management handlers
  const handleAddSizeOption = async (productId: string) => {
    try {
      const result = await createProductOptionMutation({
        input: {
          productId,
          name: 'Talla',
          type: 'SIZE' as const,
          required: true,
        }
      })
      if (result.error) {
        alert('Error al crear opción: ' + result.error.message)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleAddColorOption = async (productId: string) => {
    try {
      const result = await createProductOptionMutation({
        input: {
          productId,
          name: 'Color',
          type: 'COLOR' as const,
          required: true,
        }
      })
      if (result.error) {
        alert('Error al crear opción: ' + result.error.message)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeleteProductOption = async (optionId: string) => {
    if (!confirm('¿Eliminar esta opción y todos sus valores?')) return
    try {
      const result = await deleteProductOptionMutation({ id: optionId })
      if (result.error) {
        alert('Error: ' + result.error.message)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleAddOptionValueToOption = async (optionId: string) => {
    const value = prompt('Valor (ej: M, L, XL, Rojo, Verde):')
    if (!value) return
    const stockStr = prompt('Stock (número o deja vacío para infinito):')
    const stock = stockStr ? parseInt(stockStr, 10) : null
    
    try {
      const result = await addOptionValuesMutation({
        optionId,
        values: [{ value, stock }]
      })
      if (result.error) {
        alert('Error: ' + result.error.message)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeleteOptionValue = async (valueId: string) => {
    if (!confirm('¿Eliminar este valor?')) return
    try {
      const result = await deleteOptionValueMutation({ id: valueId })
      if (result.error) {
        alert('Error: ' + result.error.message)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
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

  // Event management handlers
  const handleAddEvent = () => {
    setEditingEvent(null)
    setEventForm({ name: '', description: '', location: '', startTime: '', endTime: '' })
    setEventFormError(null)
    setShowEventForm(true)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setEventForm({
      name: event.name,
      description: event.description || '',
      location: event.location,
      startTime: event.startTime.slice(0, 16), // Format for datetime-local
      endTime: event.endTime.slice(0, 16),
    })
    setEventFormError(null)
    setShowEventForm(true)
  }

  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEventFormError(null)

    if (!eventForm.name.trim()) {
      setEventFormError('El nombre es requerido')
      return
    }
    if (eventForm.name.length > 200) {
      setEventFormError('El nombre debe tener 200 caracteres o menos')
      return
    }
    if (!eventForm.location.trim()) {
      setEventFormError('El lugar es requerido')
      return
    }
    if (eventForm.location.length > 300) {
      setEventFormError('El lugar debe tener 300 caracteres o menos')
      return
    }
    if (!eventForm.startTime) {
      setEventFormError('La fecha de inicio es requerida')
      return
    }
    if (!eventForm.endTime) {
      setEventFormError('La fecha de fin es requerida')
      return
    }
    if (new Date(eventForm.endTime) <= new Date(eventForm.startTime)) {
      setEventFormError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    try {
      if (editingEvent) {
        const result = await updateEventMutation({
          id: editingEvent.id,
          input: {
            name: eventForm.name,
            description: eventForm.description || undefined,
            location: eventForm.location,
            startTime: new Date(eventForm.startTime).toISOString(),
            endTime: new Date(eventForm.endTime).toISOString(),
          }
        })
        if (result.error) {
          setEventFormError(result.error.message)
          return
        }
      } else {
        const result = await createEventMutation({
          input: {
            name: eventForm.name,
            description: eventForm.description || undefined,
            location: eventForm.location,
            startTime: new Date(eventForm.startTime).toISOString(),
            endTime: new Date(eventForm.endTime).toISOString(),
          }
        })
        if (result.error) {
          setEventFormError(result.error.message)
          return
        }
      }

      setShowEventForm(false)
      setEditingEvent(null)
      setEventForm({ name: '', description: '', location: '', startTime: '', endTime: '' })
    } catch (err: any) {
      setEventFormError(err.message || 'Error al guardar el evento')
    }
  }

  const handleDeleteEventClick = (eventId: string) => {
    setEventDeleteConfirm(eventId)
  }

  const handleConfirmEventDelete = async () => {
    if (!eventDeleteConfirm) return

    try {
      const result = await deleteEventMutation({ id: eventDeleteConfirm })
      if (result.error) {
        setEventFormError(result.error.message)
      }
    } catch (err: any) {
      setEventFormError(err.message || 'Error al eliminar el evento')
    }
    setEventDeleteConfirm(null)
  }

  const handleCancelEventDelete = () => {
    setEventDeleteConfirm(null)
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

      {/* User Management Section - Permission: user.create + user.delete */}
      {canManageUsers && (
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
          {canCreateProduct && (
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
          )}
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
            {/* Basic Info Row */}
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
            
            {/* Description */}
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

            {/* Image URL */}
            <div style={{ marginTop: theme.spacing.md }}>
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

            {/* Stock section - only if no options */}
            {!productForm.hasOptions && (
              <div style={{ marginTop: theme.spacing.md }}>
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
            )}

            {/* Options toggle */}
            <div style={{ marginTop: theme.spacing.lg, paddingTop: theme.spacing.md, borderTop: `1px solid ${theme.colors.border}` }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={productForm.hasOptions}
                  onChange={handleToggleHasOptions}
                  style={{ marginRight: theme.spacing.sm, width: '18px', height: '18px' }}
                />
                <span style={{ color: theme.colors.text, fontWeight: theme.typography.fontWeight.medium }}>
                  Añadir opciones de producto (talla, color, etc.)
                </span>
              </label>
              <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginTop: theme.spacing.xs, marginLeft: '26px' }}>
                Si activas esta opción, el stock se calculará como la suma del stock de cada valor de opción
              </p>
            </div>

            {/* Expanded options panel */}
            {productForm.hasOptions && (
              <div style={{ 
                marginTop: theme.spacing.md, 
                padding: theme.spacing.md, 
                background: theme.colors.background, 
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.border}`
              }}>
                {/* Option label input */}
                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                    Nombre de la opción
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Talla, Color, Medida..."
                    value={productForm.optionLabel}
                    onChange={(e) => handleOptionLabelChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      background: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.sm,
                    }}
                  />
                </div>

                {/* Option values list */}
                <div style={{ marginTop: theme.spacing.md }}>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                    Valores de la opción
                  </label>
                  
                  {productForm.optionValues.map((ov, index) => (
                    <div 
                      key={index}
                      style={{ 
                        display: 'flex', 
                        gap: theme.spacing.sm, 
                        alignItems: 'center',
                        marginBottom: theme.spacing.sm,
                        padding: theme.spacing.sm,
                        background: theme.colors.surface,
                        borderRadius: theme.borderRadius.sm,
                      }}
                    >
                      {/* Value name input */}
                      <input
                        type="text"
                        placeholder="Valor (ej: S, M, L, XL, Rojo)"
                        value={ov.value}
                        onChange={(e) => handleOptionValueChange(index, 'value', e.target.value)}
                        style={{
                          flex: 1,
                          padding: theme.spacing.xs,
                          background: theme.colors.background,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.sm,
                          color: theme.colors.text,
                          fontSize: theme.typography.fontSize.sm,
                        }}
                      />
                      
                      {/* Finite stock checkbox */}
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          checked={ov.stock !== null}
                          onChange={(e) => handleOptionValueChange(index, 'stock', e.target.checked ? '0' : '')}
                          style={{ marginRight: '4px', width: '14px', height: '14px' }}
                        />
                        Stock finito
                      </label>
                      
                      {/* Stock input (only if finite) */}
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={ov.stock === null ? '' : ov.stock}
                        onChange={(e) => handleOptionValueChange(index, 'stock', e.target.value)}
                        disabled={ov.stock === null}
                        style={{
                          width: '80px',
                          padding: theme.spacing.xs,
                          background: ov.stock === null ? theme.colors.border : theme.colors.background,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: theme.borderRadius.sm,
                          color: ov.stock === null ? theme.colors.textSecondary : theme.colors.text,
                          fontSize: theme.typography.fontSize.sm,
                        }}
                      />
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionValue(index)}
                        style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          background: theme.colors.error,
                          color: '#fff',
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.fontSize.sm,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add value button */}
                  <button
                    type="button"
                    onClick={handleAddOptionValue}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      background: 'transparent',
                      border: `1px dashed ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      color: theme.colors.textSecondary,
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.sm,
                    }}
                  >
                    + Añadir valor
                  </button>
                </div>
              </div>
            )}
            
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
                      {canEditProduct && (
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
                      )}
                      {canDeleteProduct && (
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
                      )}
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
          {canCreateNews && (
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
          )}
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
                      {canEditNews && (
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
                      )}
                      {canDeleteNews && (
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Event Management Section - Staff+ */}
      <section data-testid="event-management-section" style={{ marginTop: theme.spacing['2xl'] }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Gestión de Eventos
          </h2>
          {canCreateEvent && (
            <button
              onClick={handleAddEvent}
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
              Añadir Evento
            </button>
          )}
        </div>

        {/* Event Form Modal */}
        {showEventForm && (
          <form
            data-testid="event-form"
            onSubmit={handleEventFormSubmit}
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
                Nombre *
              </label>
              <input
                type="text"
                placeholder="Nombre del evento"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                required
                maxLength={200}
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
                Descripción
              </label>
              <textarea
                placeholder="Descripción del evento (opcional)"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
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
            <div style={{ marginTop: theme.spacing.md }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Lugar *
              </label>
              <input
                type="text"
                placeholder="Lugar del evento"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                required
                maxLength={300}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
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
                  Fecha y Hora de Fin *
                </label>
                <input
                  type="datetime-local"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
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

            {eventFormError && (
              <p style={{ color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
                {eventFormError}
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
                {editingEvent ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => { setShowEventForm(false); setEditingEvent(null); }}
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
        {eventDeleteConfirm && (
          <div
            data-testid="event-delete-confirm-dialog"
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.error}`,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <p style={{ color: theme.colors.text, marginBottom: theme.spacing.md }}>
              ¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <button
                onClick={handleConfirmEventDelete}
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
                onClick={handleCancelEventDelete}
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

        {/* Event List Table */}
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden',
          }}
        >
          {events.length === 0 ? (
            <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
              No hay eventos aún. Haz clic en 'Añadir Evento' para crear uno.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.colors.border }}>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Nombre</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Lugar</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Fecha/Hora</th>
                  <th style={{ padding: theme.spacing.sm, textAlign: 'right', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                  >
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{event.name}</td>
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{event.location}</td>
                    <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>
                      {new Date(event.startTime).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: theme.spacing.sm, textAlign: 'right' }}>
                      {canEditEvent && (
                        <button
                          data-testid={`edit-event-btn-${event.id}`}
                          onClick={() => handleEditEvent(event)}
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
                      )}
                      {canDeleteEvent && (
                        <button
                          data-testid={`delete-event-btn-${event.id}`}
                          onClick={() => handleDeleteEventClick(event.id)}
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
