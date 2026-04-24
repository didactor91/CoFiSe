import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAllEventsQuery } from '../../graphql/queries'
import { useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation } from '../../graphql/mutations'
import theme from '../../theme'

export default function EventsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [eventsResult] = useAllEventsQuery()
  const [, createEventMutation] = useCreateEventMutation()
  const [, updateEventMutation] = useUpdateEventMutation()
  const [, deleteEventMutation] = useDeleteEventMutation()

  const events = eventsResult.data?.allEvents ?? []

  const canCreate = can('event.create')
  const canEdit = can('event.update')
  const canDelete = can('event.delete') // ADMIN only

  // Event form state
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [eventForm, setEventForm] = useState({ name: '', description: '', location: '', startTime: '', endTime: '' })
  const [eventFormError, setEventFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleAddEvent = () => {
    setEditingEvent(null)
    setEventForm({ name: '', description: '', location: '', startTime: '', endTime: '' })
    setEventFormError(null)
    setShowEventForm(true)
  }

  const handleEditEvent = (item: any) => {
    setEditingEvent(item)
    setEventForm({
      name: item.name,
      description: item.description || '',
      location: item.location,
      startTime: item.startTime.slice(0, 16),
      endTime: item.endTime.slice(0, 16)
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
    if (!eventForm.startTime || !eventForm.endTime) {
      setEventFormError('Las fechas son requeridas')
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
            endTime: new Date(eventForm.endTime).toISOString()
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
            endTime: new Date(eventForm.endTime).toISOString()
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
      setEventFormError(err.message || 'Error al guardar')
    }
  }

  const handleDeleteEventClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteEventMutation({ id: deleteConfirm })
    } catch (err: any) {
      setEventFormError(err.message || 'Error al eliminar')
    }
    setDeleteConfirm(null)
  }

  return (
    <div data-testid="events-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <h1 style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
        }}>
          Gestión de Eventos
        </h1>
        {canCreate && (
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

      {showEventForm && (
        <form
          onSubmit={handleEventFormSubmit}
          data-testid="event-form"
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
            <div>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Lugar *
              </label>
              <input
                type="text"
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
          </div>
          <div style={{ marginTop: theme.spacing.md }}>
            <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
              Descripción (opcional)
            </label>
            <textarea
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
            <div>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Fecha/Hora inicio *
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
                Fecha/Hora fin *
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

      {deleteConfirm && (
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
            ¿Eliminar evento? Esta acción no se puede deshacer.
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
              onClick={() => setDeleteConfirm(null)}
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
            No hay eventos. Haz clic en 'Añadir Evento' para crear uno.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.colors.border }}>
                <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Nombre</th>
                <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Lugar</th>
                <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Fecha</th>
                <th style={{ padding: theme.spacing.sm, textAlign: 'right', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} onClick={() => navigate(`/events/${event.id}?from=admin`)} style={{ cursor: 'pointer', borderBottom: `1px solid ${theme.colors.border}` }}>
                  <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{event.name}</td>
                  <td style={{ padding: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>{event.location}</td>
                  <td style={{ padding: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>
                    {new Date(event.startTime).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: theme.spacing.sm, textAlign: 'right' }}>
                    {canEdit && (
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
                    {canDelete && (
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
    </div>
  )
}