import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { News } from '../../graphql/generated-types'
import { useCreateNewsMutation, useUpdateNewsMutation, useDeleteNewsMutation } from '../../graphql/mutations'
import { useAllNewsQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Panel } from '../../shared/ui/Panel'
import theme from '../../theme'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function NewsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [newsResult] = useAllNewsQuery()
  const [, createNewsMutation] = useCreateNewsMutation()
  const [, updateNewsMutation] = useUpdateNewsMutation()
  const [, deleteNewsMutation] = useDeleteNewsMutation()

  const news: News[] = newsResult.data?.allNews ?? []

  const canCreate = can('news.create')
  const canEdit = can('news.update')
  const canDelete = can('news.delete')

  // News form state
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '' })
  const [newsFormError, setNewsFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleAddNews = () => {
    setEditingNews(null)
    setNewsForm({ title: '', content: '', imageUrl: '' })
    setNewsFormError(null)
    setShowNewsForm(true)
  }

  const handleEditNews = (item: News) => {
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
    } catch (err: unknown) {
      setNewsFormError(toErrorMessage(err, 'Error al guardar'))
    }
  }

  const handleDeleteNewsClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteNewsMutation({ id: deleteConfirm })
    } catch (err: unknown) {
      setNewsFormError(toErrorMessage(err, 'Error al eliminar'))
    }
    setDeleteConfirm(null)
  }

  return (
    <div data-testid="news-page">
      <PageHeader
        title="Gestión de Noticias"
        action={canCreate ? <Button onClick={handleAddNews}>Añadir Noticia</Button> : undefined}
      />

      {showNewsForm && (
        <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <form
          onSubmit={handleNewsFormSubmit}
          data-testid="news-form"
          style={{}}
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
            <Button type="submit">
              {editingNews ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setShowNewsForm(false); setEditingNews(null); }}>
              Cancelar
            </Button>
          </div>
        </form>
        </Panel>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          testId="news-delete-confirm-dialog"
          message="¿Eliminar noticia? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <Panel style={{ overflow: 'hidden' }}>
        {news.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            No hay noticias. Haz clic en 'Añadir Noticia' para crear una.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Título</th>
                  <th className="admin-th">Contenido</th>
                  <th className="admin-th">Fecha</th>
                  <th className="admin-th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item) => (
                  <tr key={item.id} onClick={() => navigate(`/news/${item.id}?from=admin`)} className="admin-row cursor-pointer">
                    <td className="admin-td font-medium text-slate-800">{item.title}</td>
                    <td className="admin-td max-w-[240px] truncate text-xs text-slate-500">
                      {item.content}
                    </td>
                    <td className="admin-td text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="admin-td text-right">
                      {canEdit && (
                        <Button
                          data-testid={`edit-news-btn-${item.id}`}
                          onClick={() => handleEditNews(item)}
                          style={{ marginRight: theme.spacing.xs, padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                        >
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          data-testid={`delete-news-btn-${item.id}`}
                          onClick={() => handleDeleteNewsClick(item.id)}
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
