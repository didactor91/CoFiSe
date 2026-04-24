import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Event } from '../../graphql/generated-types'
import { useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation } from '../../graphql/mutations'
import { useAllEventsQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Panel } from '../../shared/ui/Panel'
import theme from '../../theme'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function EventsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [eventsResult] = useAllEventsQuery()
  const [, createEventMutation] = useCreateEventMutation()
  const [, updateEventMutation] = useUpdateEventMutation()
  const [, deleteEventMutation] = useDeleteEventMutation()

  const events: Event[] = eventsResult.data?.allEvents ?? []

  const canCreate = can('event.create')
  const canEdit = can('event.update')
  const canDelete = can('event.delete') // ADMIN only

  // Event form state
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [eventForm, setEventForm] = useState({ name: '', description: '', location: '', startTime: '', endTime: '' })
  const [eventFormError, setEventFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleAddEvent = () => {
    setEditingEvent(null)
    setEventForm({ name: '', description: '', location: '', startTime: '', endTime: '' })
    setEventFormError(null)
    setShowEventForm(true)
  }

  const handleEditEvent = (item: Event) => {
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
    } catch (err: unknown) {
      setEventFormError(toErrorMessage(err, 'Error al guardar'))
    }
  }

  const handleDeleteEventClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteEventMutation({ id: deleteConfirm })
    } catch (err: unknown) {
      setEventFormError(toErrorMessage(err, 'Error al eliminar'))
    }
    setDeleteConfirm(null)
  }

  return (
    <div data-testid="events-page">
      <PageHeader
        title="Gestión de Eventos"
        action={canCreate ? <Button onClick={handleAddEvent}>Añadir Evento</Button> : undefined}
      />

      {showEventForm && (
        <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <form
          onSubmit={handleEventFormSubmit}
          data-testid="event-form"
          style={{}}
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
            <Button type="submit">
              {editingEvent ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setShowEventForm(false); setEditingEvent(null); }}>
              Cancelar
            </Button>
          </div>
        </form>
        </Panel>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          testId="event-delete-confirm-dialog"
          message="¿Eliminar evento? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <Panel style={{ overflow: 'hidden' }}>
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
                      <Button
                        data-testid={`edit-event-btn-${event.id}`}
                        onClick={() => handleEditEvent(event)}
                        style={{ marginRight: theme.spacing.xs, padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                      >
                        Editar
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        data-testid={`delete-event-btn-${event.id}`}
                        onClick={() => handleDeleteEventClick(event.id)}
                        variant="secondary"
                        style={{ padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
