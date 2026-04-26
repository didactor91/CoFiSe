import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { ImageUpload } from '../components/ImageUpload'
import {
  useUpdateNewsMutation,
  usePublishNewsMutation,
  useUnpublishNewsMutation,
} from '../graphql/mutations'
import { useNewsItemQuery } from '../graphql/queries'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../shared/ui/Button'
import { Panel } from '../shared/ui/Panel'
import theme from '../theme'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'

  const { can } = useAuth()
  const [result] = useNewsItemQuery(id!)
  const [, updateNewsMutation] = useUpdateNewsMutation()
  const [, publishNewsMutation] = usePublishNewsMutation()
  const [, unpublishNewsMutation] = useUnpublishNewsMutation()

  const canEdit = can('news.update')

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '' })
  const [formError, setFormError] = useState<string | null>(null)

  const handleEdit = () => {
    if (!result.data?.newsItem) return
    const { newsItem } = result.data
    setNewsForm({
      title: newsItem.title,
      content: newsItem.content,
      imageUrl: newsItem.imageUrl || '',
    })
    setFormError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!newsForm.title.trim()) {
      setFormError('El título es requerido')
      return
    }
    if (!newsForm.content.trim()) {
      setFormError('El contenido es requerido')
      return
    }

    try {
      const updateResult = await updateNewsMutation({
        id: id!,
        input: { title: newsForm.title, content: newsForm.content, imageUrl: newsForm.imageUrl || undefined },
      })
      if (updateResult.error) {
        setFormError(updateResult.error.message)
        return
      }
      setIsEditing(false)
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al guardar'))
    }
  }

  const handleTogglePublished = async () => {
    if (!result.data?.newsItem) return
    try {
      const newsItem = result.data.newsItem
      const result = newsItem.published
        ? await unpublishNewsMutation({ id: id! })
        : await publishNewsMutation({ id: id! })
      if (result.error) {
        setFormError(result.error.message)
      }
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al publicar'))
    }
  }

  if (result.fetching) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>⏳</div>
        <p style={{ color: theme.colors.textSecondary }}>Cargando...</p>
      </div>
    )
  }

  if (result.error || !result.data?.newsItem) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md }}>Noticia no encontrada</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: theme.colors.accent,
            color: theme.colors.background,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
          }}
        >
          Volver
        </button>
      </div>
    )
  }

  const { newsItem } = result.data

  // Edit mode - show form
  if (isEditing) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: `0 ${theme.spacing.xl}` }}>
        <Panel style={{ padding: theme.spacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: theme.spacing.lg }}>Editar Noticia</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: theme.spacing.md }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Título *
              </label>
              <input
                type="text"
                value={newsForm.title}
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                required
                style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
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
                style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm, resize: 'vertical' }}
              />
            </div>
            <ImageUpload
              entityType="NEWS"
              entityId={id}
              currentImageUrl={newsForm.imageUrl}
              onUploadComplete={(imageUrl) => setNewsForm(prev => ({ ...prev, imageUrl }))}
            />
            {formError && (
              <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>{formError}</p>
            )}
            <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <Button type="submit">Actualizar</Button>
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
            </div>
          </form>
        </Panel>
      </div>
    )
  }

  // View mode
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: `0 ${theme.spacing.xl}`,
    }}>
      {fromAdmin && (
        <div style={{
          display: 'inline-block',
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          background: theme.colors.warning,
          color: theme.colors.background,
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          marginBottom: theme.spacing.md,
        }}>
          Modo Admin
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        style={{
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          background: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.sm,
          cursor: 'pointer',
          marginBottom: theme.spacing.lg,
        }}
      >
        ← Volver
      </button>

      {fromAdmin && canEdit && (
        <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          <Button onClick={handleEdit}>Editar</Button>
          <Button
            onClick={handleTogglePublished}
            style={{
              background: newsItem.published ? '#dc2626' : '#16a34a',
              borderColor: newsItem.published ? '#dc2626' : '#16a34a',
              color: '#ffffff',
            }}
          >
            {newsItem.published ? 'Despublicar' : 'Publicar'}
          </Button>
        </div>
      )}

      <h1 style={{
        color: theme.colors.text,
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.lg,
        fontFamily: theme.typography.fontFamily,
      }}>
        {newsItem.title}
      </h1>

      {newsItem.imageUrl && (
        <img
          src={newsItem.imageUrl}
          alt={newsItem.title}
          style={{
            width: '100%',
            maxHeight: '400px',
            objectFit: 'cover',
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.lg,
          }}
        />
      )}

      <p style={{
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.base,
        lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
        marginBottom: theme.spacing.lg,
      }}>
        {newsItem.content}
      </p>

      <p style={{
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.sm,
      }}>
        {new Date(newsItem.createdAt).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  )
}