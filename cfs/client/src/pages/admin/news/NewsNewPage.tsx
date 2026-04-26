import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ImageUpload } from '../../../components/ImageUpload'
import { useCreateNewsMutation } from '../../../graphql/mutations'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import theme from '../../../theme'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function NewsNewPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [, createNewsMutation] = useCreateNewsMutation()

  const canCreate = can('news.create')
  const [newsForm, setNewsForm] = useState({ title: '', content: '', imageUrl: '' })
  const [newsFormError, setNewsFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewsFormError(null)

    if (!canCreate) {
      setNewsFormError('No tienes permiso para crear noticias')
      return
    }

    if (!newsForm.title.trim()) {
      setNewsFormError('El título es requerido')
      return
    }
    if (!newsForm.content.trim()) {
      setNewsFormError('El contenido es requerido')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createNewsMutation({
        input: { title: newsForm.title, content: newsForm.content, imageUrl: newsForm.imageUrl || undefined }
      })
      if (result.error) {
        setNewsFormError(result.error.message)
        setIsSubmitting(false)
        return
      }
      navigate('/admin/news')
    } catch (err: unknown) {
      setNewsFormError(toErrorMessage(err, 'Error al guardar'))
      setIsSubmitting(false)
    }
  }

  return (
    <div data-testid="news-new-page">
      <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <div style={{ marginBottom: theme.spacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: theme.spacing.xs }}>Nueva Noticia</h2>
          <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
            Completa los datos de la noticia
          </p>
        </div>

        <form onSubmit={handleSubmit} data-testid="news-form">
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
          <ImageUpload
            entityType="NEWS"
            entityId={undefined}
            currentImageUrl={newsForm.imageUrl}
            onUploadComplete={(imageUrl) => setNewsForm(prev => ({ ...prev, imageUrl }))}
          />
          {newsFormError && (
            <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
              {newsFormError}
            </p>
          )}
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/news')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}