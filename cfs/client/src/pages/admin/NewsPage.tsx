import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ImageUpload } from '../../components/ImageUpload'
import type { News } from '../../graphql/generated-types'
import {
  useCreateNewsMutation,
  useUpdateNewsMutation,
  usePublishNewsMutation,
  useUnpublishNewsMutation,
  useDeleteNewsMutation,
} from '../../graphql/mutations'
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
  const [, publishNewsMutation] = usePublishNewsMutation()
  const [, unpublishNewsMutation] = useUnpublishNewsMutation()
  const [, deleteNewsMutation] = useDeleteNewsMutation()

  const news: News[] = newsResult.data?.allNews ?? []

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('')

  // Filter news based on search query
  const filteredNews = searchQuery.trim()
    ? news.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : news

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

  const handleTogglePublished = async (item: News) => {
    try {
      const result = item.published
        ? await unpublishNewsMutation({ id: item.id })
        : await publishNewsMutation({ id: item.id })

      if (result.error) {
        setNewsFormError(result.error.message)
      }
    } catch (err: unknown) {
      setNewsFormError(toErrorMessage(err, 'Error al actualizar el estado de publicación'))
    }
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
          {/* Image */}
          <ImageUpload
            entityType="NEWS"
            entityId={editingNews?.id}
            currentImageUrl={newsForm.imageUrl}
            onUploadComplete={(imageUrl) => setNewsForm(prev => ({ ...prev, imageUrl }))}
          />
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
        {/* Search input */}
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <input
            type="text"
            placeholder="Buscar noticias por título o contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="news-search-input"
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

        {filteredNews.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            {searchQuery ? 'No hay noticias que coincidan con la búsqueda' : 'No hay noticias. Haz clic en \'Añadir Noticia\' para crear una.'}
          </p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Título</th>
                  <th className="admin-th">Contenido</th>
                  <th className="admin-th">Estado</th>
                  <th className="admin-th">Fecha</th>
                  <th className="admin-th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredNews.map((item) => (
                  <tr key={item.id} onClick={() => navigate(`/news/${item.id}?from=admin`)} className="admin-row cursor-pointer">
                    <td className="admin-td font-medium text-slate-800">{item.title}</td>
                    <td className="admin-td max-w-[240px] truncate text-xs text-slate-500">
                      {item.content}
                    </td>
                    <td className="admin-td text-xs">
                      <span className={item.published ? 'text-emerald-600' : 'text-slate-500'}>
                        {item.published ? 'Publicada' : 'Borrador'}
                      </span>
                    </td>
                    <td className="admin-td text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="admin-td text-right">
                      {canEdit && (
                        <Button
                          data-testid={`toggle-news-published-btn-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleTogglePublished(item)
                          }}
                          style={{
                            marginRight: theme.spacing.xs,
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            background: item.published ? '#dc2626' : '#16a34a',
                            borderColor: item.published ? '#dc2626' : '#16a34a',
                            color: '#ffffff',
                          }}
                        >
                          {item.published ? 'Despublicar' : 'Publicar'}
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          data-testid={`edit-news-btn-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditNews(item)
                          }}
                          style={{ marginRight: theme.spacing.xs, padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                        >
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          data-testid={`delete-news-btn-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNewsClick(item.id)
                          }}
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
