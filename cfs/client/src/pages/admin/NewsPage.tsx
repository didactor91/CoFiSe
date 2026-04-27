import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { News } from '../../graphql/generated-types'
import { useDeleteNewsMutation } from '../../graphql/mutations'
import { useAllNewsQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Panel } from '../../shared/ui/Panel'
import theme from '../../theme'

export default function NewsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [newsResult] = useAllNewsQuery()
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
  const canDelete = can('news.delete')

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDeleteNewsClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteNewsMutation({ id: deleteConfirm })
    } catch (err) {
      console.error('Error deleting news:', err)
    }
    setDeleteConfirm(null)
    newsResult.refetch({ requestPolicy: 'network-only' })
  }

  return (
    <div data-testid="news-page">
      <PageHeader
        title="Gestión de Noticias"
        action={canCreate ? <Button onClick={() => navigate('/admin/news/new')}>Añadir Noticia</Button> : undefined}
      />

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