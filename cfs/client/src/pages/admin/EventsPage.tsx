import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ImageUpload } from '../../components/ImageUpload'
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

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('')

  // Filter events based on search query
  const filteredEvents = searchQuery.trim()
    ? events.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events

  const canCreate = can('event.create')
  const canEdit = can('event.update')
  const canDelete = can('event.delete') // ADMIN only

  // Event form state
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [eventForm, setEventForm] = useState({ name: '', description: '', location: '', startTime: '', endTime: '', imageUrl: '' })
  const [eventFormError, setEventFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleAddEvent = () => {
    setEditingEvent(null)
    setEventForm({ name: '', description: '', location: '', startTime: '', endTime: '', imageUrl: '' })
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
      endTime: item.endTime.slice(0, 16),
      imageUrl: item.imageUrl || ''
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
            endTime: new Date(eventForm.endTime).toISOString(),
            imageUrl: eventForm.imageUrl || undefined
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
            imageUrl: eventForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setEventFormError(result.error.message)
          return
        }
      }
      setShowEventForm(false)
      setEditingEvent(null)
      setEventForm({ name: '', description: '', location: '', startTime: '', endTime: '', imageUrl: '' })
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: theme.spacing.md }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
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

          {/* Image */}
          <ImageUpload
            entityType="EVENT"
            entityId={editingEvent?.id}
            currentImageUrl={eventForm.imageUrl}
            onUploadComplete={(imageUrl) => setEventForm(prev => ({ ...prev, imageUrl }))}
          />

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
        {/* Search input */}
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <input
            type="text"
            placeholder="Buscar eventos por nombre, descripción o lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="event-search-input"
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

        {filteredEvents.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            {searchQuery ? 'No hay eventos que coincidan con la búsqueda' : 'No hay eventos. Haz clic en \'Añadir Evento\' para crear uno.'}
          </p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Nombre</th>
                  <th className="admin-th">Lugar</th>
                  <th className="admin-th">Fecha</th>
                  <th className="admin-th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} onClick={() => navigate(`/events/${event.id}?from=admin`)} className="admin-row cursor-pointer">
                    <td className="admin-td font-medium text-slate-800">{event.name}</td>
                    <td className="admin-td text-xs text-slate-500">{event.location}</td>
                    <td className="admin-td text-xs text-slate-500">
                      {new Date(event.startTime).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="admin-td text-right">
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
          </div>
        )}
      </Panel>
    </div>
  )
}
