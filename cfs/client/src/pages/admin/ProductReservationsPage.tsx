import { useMemo, useState } from 'react'

import {
  ReservationStatus as ReservationStatusEnum,
  type Reservation,
  type ReservationStatus,
} from '../../graphql/generated-types'
import {
  useUpdateReservationMutation,
  useUpdateReservationStatusMutation,
} from '../../graphql/mutations'
import { useProductsQuery, useReservationsQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../shared/ui/Button'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Panel } from '../../shared/ui/Panel'
import theme from '../../theme'

interface EditableReservationItem {
  productId: string
  quantity: string
  optionValueId: string
}

interface ReservationEditState {
  id: string
  name: string
  email: string
  phone: string
  notes: string
  items: EditableReservationItem[]
}

const statusLabels: Record<ReservationStatus, string> = {
  [ReservationStatusEnum.PendingUnverified]: 'Pendiente verificación',
  [ReservationStatusEnum.Pending]: 'Pendiente',
  [ReservationStatusEnum.Confirmed]: 'Confirmada',
  [ReservationStatusEnum.Cancelled]: 'Cancelada',
  [ReservationStatusEnum.Completed]: 'Completada',
}

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function ProductReservationsPage() {
  const { can } = useAuth()
  const canReadReservations = can('reservation.read')
  const canUpdateReservations = can('reservation.update')

  const [statusFilter, setStatusFilter] = useState<ReservationStatus | null>(null)
  const [reservationError, setReservationError] = useState<string | null>(null)
  const [editingReservation, setEditingReservation] = useState<ReservationEditState | null>(null)

  const [reservationsResult, reexecuteReservations] = useReservationsQuery({
    status: statusFilter ?? undefined,
  })
  const [productsResult] = useProductsQuery()
  const [updateReservationStatusResult, updateReservationStatus] = useUpdateReservationStatusMutation()
  const [updateReservationResult, updateReservation] = useUpdateReservationMutation()

  const reservations = useMemo(
    () => reservationsResult.data?.reservations ?? [],
    [reservationsResult.data?.reservations]
  )
  const products = useMemo(
    () => productsResult.data?.products ?? [],
    [productsResult.data?.products]
  )

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]))
  }, [products])

  const isLoading =
    reservationsResult.fetching || productsResult.fetching || updateReservationStatusResult.fetching

  const refreshReservations = () => {
    reexecuteReservations({ requestPolicy: 'network-only' })
  }

  const openEditReservation = (reservation: Reservation) => {
    const items = reservation.items.length
      ? reservation.items.map((item) => ({
          productId: item.productId,
          quantity: String(item.quantity),
          optionValueId: item.optionValueId ?? '',
        }))
      : [
          {
            productId: reservation.productId,
            quantity: String(reservation.quantity),
            optionValueId: '',
          },
        ]

    setEditingReservation({
      id: reservation.id,
      name: reservation.name,
      email: reservation.email,
      phone: reservation.phone,
      notes: reservation.notes ?? '',
      items,
    })
    setReservationError(null)
  }

  const handleUpdateReservationStatus = async (id: string, status: ReservationStatus) => {
    setReservationError(null)
    try {
      const result = await updateReservationStatus({ id, status })
      if (result.error) {
        setReservationError(result.error.message)
        return
      }
      refreshReservations()
    } catch (err: unknown) {
      setReservationError(toErrorMessage(err, 'Error al actualizar el estado de la reserva'))
    }
  }

  const updateEditingItem = (index: number, key: keyof EditableReservationItem, value: string) => {
    if (!editingReservation) return
    const nextItems = [...editingReservation.items]
    nextItems[index] = { ...nextItems[index], [key]: value }
    if (key === 'productId') {
      nextItems[index] = { ...nextItems[index], optionValueId: '' }
    }
    setEditingReservation({ ...editingReservation, items: nextItems })
  }

  const addEditingItem = () => {
    if (!editingReservation || products.length === 0) return
    setEditingReservation({
      ...editingReservation,
      items: [
        ...editingReservation.items,
        { productId: products[0].id, quantity: '1', optionValueId: '' },
      ],
    })
  }

  const removeEditingItem = (index: number) => {
    if (!editingReservation || editingReservation.items.length <= 1) return
    setEditingReservation({
      ...editingReservation,
      items: editingReservation.items.filter((_, idx) => idx !== index),
    })
  }

  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReservation) return

    if (!editingReservation.name.trim() || !editingReservation.email.trim() || !editingReservation.phone.trim()) {
      setReservationError('Nombre, email y teléfono son obligatorios')
      return
    }

    const parsedItems = editingReservation.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      optionValueId: item.optionValueId || undefined,
    }))

    if (parsedItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      setReservationError('Cada línea debe tener producto y una cantidad mayor que 0')
      return
    }

    setReservationError(null)
    try {
      const result = await updateReservation({
        id: editingReservation.id,
        input: {
          name: editingReservation.name.trim(),
          email: editingReservation.email.trim(),
          phone: editingReservation.phone.trim(),
          notes: editingReservation.notes.trim(),
          items: parsedItems,
        },
      })

      if (result.error) {
        setReservationError(result.error.message)
        return
      }

      setEditingReservation(null)
      refreshReservations()
    } catch (err: unknown) {
      setReservationError(toErrorMessage(err, 'Error al editar la reserva'))
    }
  }

  if (!canReadReservations) {
    return (
      <Panel>
        <p style={{ color: theme.colors.textSecondary }}>No tienes permisos para ver reservas.</p>
      </Panel>
    )
  }

  return (
    <div data-testid="product-reservations-page">
      <PageHeader title="Gestión de Reservas" />

      <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap', marginBottom: theme.spacing.md }}>
        <Button
          onClick={() => setStatusFilter(null)}
          variant={statusFilter === null ? 'primary' : 'secondary'}
          type="button"
        >
          Todas
        </Button>
        <Button
          onClick={() => setStatusFilter(ReservationStatusEnum.Pending)}
          variant={statusFilter === ReservationStatusEnum.Pending ? 'primary' : 'secondary'}
          type="button"
        >
          Pendientes
        </Button>
        <Button
          onClick={() => setStatusFilter(ReservationStatusEnum.Confirmed)}
          variant={statusFilter === ReservationStatusEnum.Confirmed ? 'primary' : 'secondary'}
          type="button"
        >
          Confirmadas
        </Button>
        <Button
          onClick={() => setStatusFilter(ReservationStatusEnum.Cancelled)}
          variant={statusFilter === ReservationStatusEnum.Cancelled ? 'primary' : 'secondary'}
          type="button"
        >
          Canceladas
        </Button>
      </div>

      {reservationError && (
        <p style={{ color: theme.colors.error, marginBottom: theme.spacing.sm }}>{reservationError}</p>
      )}

      {editingReservation && (
        <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <form onSubmit={handleSaveReservation}>
            <h3 style={{ marginTop: 0, marginBottom: theme.spacing.md }}>Editar reserva</h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: theme.spacing.md,
              }}
            >
              <input
                type="text"
                placeholder="Nombre"
                value={editingReservation.name}
                onChange={(e) => setEditingReservation({ ...editingReservation, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={editingReservation.email}
                onChange={(e) => setEditingReservation({ ...editingReservation, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={editingReservation.phone}
                onChange={(e) => setEditingReservation({ ...editingReservation, phone: e.target.value })}
              />
            </div>

            <textarea
              placeholder="Notas"
              value={editingReservation.notes}
              onChange={(e) => setEditingReservation({ ...editingReservation, notes: e.target.value })}
              style={{ width: '100%', marginTop: theme.spacing.md }}
            />

            <div style={{ marginTop: theme.spacing.md }}>
              {editingReservation.items.map((item, index) => {
                const selectedProduct = productsById.get(item.productId)
                const optionValues = selectedProduct?.options?.[0]?.values ?? []
                return (
                  <div
                    key={`${item.productId}-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(180px, 1fr) 120px minmax(180px, 1fr) auto',
                      gap: theme.spacing.sm,
                      alignItems: 'center',
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <select
                      value={item.productId}
                      onChange={(e) => updateEditingItem(index, 'productId', e.target.value)}
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateEditingItem(index, 'quantity', e.target.value)}
                    />
                    <select
                      value={item.optionValueId}
                      onChange={(e) => updateEditingItem(index, 'optionValueId', e.target.value)}
                      disabled={optionValues.length === 0}
                    >
                      <option value="">Sin talla/opción</option>
                      {optionValues.map((value) => (
                        <option key={value.id} value={value.id}>
                          {value.value}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removeEditingItem(index)}
                      disabled={editingReservation.items.length <= 1}
                    >
                      Quitar
                    </Button>
                  </div>
                )
              })}

              <Button type="button" onClick={addEditingItem} variant="ghost">
                + Añadir producto
              </Button>
            </div>

            <div style={{ marginTop: theme.spacing.md, display: 'flex', gap: theme.spacing.sm }}>
              <Button type="submit" disabled={updateReservationResult.fetching}>
                Guardar cambios
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditingReservation(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            Cargando reservas...
          </p>
        ) : reservations.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            No hay reservas para este filtro.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Cliente</th>
                  <th className="admin-th">Contacto</th>
                  <th className="admin-th">Productos</th>
                  <th className="admin-th">Estado</th>
                  <th className="admin-th">Creada</th>
                  <th className="admin-th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => {
                  const summary = reservation.items.length
                    ? reservation.items
                        .map((item) =>
                          `${item.quantity}x ${item.productName}${item.optionValue ? ` (${item.optionValue})` : ''}`
                        )
                        .join(' · ')
                    : `${reservation.quantity}x ${reservation.product.name}`

                  return (
                    <tr key={reservation.id} className="admin-row">
                      <td className="admin-td font-medium text-slate-800">{reservation.name}</td>
                      <td className="admin-td">
                        <div>{reservation.email}</div>
                        <div style={{ color: theme.colors.textSecondary }}>{reservation.phone}</div>
                      </td>
                      <td className="admin-td">{summary}</td>
                      <td className="admin-td">{statusLabels[reservation.status]}</td>
                      <td className="admin-td">{new Date(reservation.createdAt).toLocaleString('es-ES')}</td>
                      <td className="admin-td text-right">
                        {canUpdateReservations && reservation.status === ReservationStatusEnum.Pending && (
                          <>
                            <Button
                              type="button"
                              onClick={() =>
                                handleUpdateReservationStatus(reservation.id, ReservationStatusEnum.Confirmed)
                              }
                              style={{
                                marginRight: theme.spacing.xs,
                                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                              }}
                              disabled={updateReservationStatusResult.fetching}
                            >
                              Aceptar
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() =>
                                handleUpdateReservationStatus(reservation.id, ReservationStatusEnum.Cancelled)
                              }
                              style={{
                                marginRight: theme.spacing.xs,
                                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                              }}
                              disabled={updateReservationStatusResult.fetching}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}

                        {canUpdateReservations && (
                          <Button
                            type="button"
                            onClick={() => openEditReservation(reservation)}
                            style={{ padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                          >
                            Editar
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
