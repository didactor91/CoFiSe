import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
=======
import { useAuth } from '../../hooks/useAuth'
import { useAllNewsQuery } from '../../graphql/queries'
import { useCreateNewsMutation, useUpdateNewsMutation, useDeleteNewsMutation } from '../../graphql/mutations'
import theme from '../../theme'

export default function NewsPage() {
  const navigate = useNavigate()
=======
  const { can } = useAuth()
  const [newsResult] = useAllNewsQuery()
  const [, createNewsMutation] = useCreateNewsMutation()
  const [, updateNewsMutation] = useUpdateNewsMutation()
  const [, deleteNewsMutation] = useDeleteNewsMutation()

  const news = newsResult.data?.allNews ?? []

  const canCreate = can('news.create')
  const canEdit = can('news.update')
  const canDelete = can('news.delete')

  // News form state
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingNews, setEditingNews] = useState<any>(null)
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '' })
  const [newsFormError, setNewsFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleAddNews = () => {
    setEditingNews(null)
    setNewsForm({ title: '', content: '', imageUrl: '' })
    setNewsFormError(null)
    setShowNewsForm(true)
  }

  const handleEditNews = (item: any) => {
    setEditingNews(item)
    setNewsForm({ title: item.title, content: item.content, imageUrl: item.imageUrl || '' })
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
          input: { title: newsForm.title, content: newsForm.content, imageUrl: newsForm.imageUrl || undefined }
        })
        if (result.error) {
          setNewsFormError(result.error.message)
          return
        }
      } else {
        const result = await createNewsMutation({
          input: { title: newsForm.title, content: newsForm.content, imageUrl: newsForm.imageUrl || undefined }
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
      setNewsFormError(err.message || 'Error al guardar')
    }
  }

  const handleDeleteNewsClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteNewsMutation({ id: deleteConfirm })
    } catch (err: any) {
      setNewsFormError(err.message || 'Error al eliminar')
    }
    setDeleteConfirm(null)
  }

  return (
    <div data-testid="news-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <h1 style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
        }}>
          Gestión de Noticias
        </h1>
        {canCreate && (
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

      {showNewsForm && (
        <form
          onSubmit={handleNewsFormSubmit}
          data-testid="news-form"
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}
        >
          <div style={{ marginBottom: theme.spacing.md }}>
            <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
              Título *
            </label>
            <input
              type="text"
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
          <div style={{ marginBottom: theme.spacing.md }}>
            <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
              Contenido *
            </label>
            <textarea
              value={newsForm.content}
              onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
              required
              rows={4}
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
          <div style={{ marginBottom: theme.spacing.md }}>
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
            <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
              {newsFormError}
            </p>
          )}
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
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

      {deleteConfirm && (
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
            ¿Eliminar noticia? Esta acción no se puede deshacer.
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
        {news.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            No hay noticias. Haz clic en 'Añadir Noticia' para crear una.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.colors.border }}>
                <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Título</th>
                <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Contenido</th>
                <th style={{ padding: theme.spacing.sm, textAlign: 'left', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Fecha</th>
                <th style={{ padding: theme.spacing.sm, textAlign: 'right', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr key={item.id} onClick={() => navigate(`/news/${item.id}?from=admin`)} style={{ cursor: 'pointer', borderBottom: `1px solid ${theme.colors.border}` }}>
=======
                <tr key={item.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{item.title}</td>
                  <td style={{ padding: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.content}
                  </td>
                  <td style={{ padding: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>
                    {new Date(item.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td style={{ padding: theme.spacing.sm, textAlign: 'right' }}>
                    {canEdit && (
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
                    {canDelete && (
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
    </div>
  )
}