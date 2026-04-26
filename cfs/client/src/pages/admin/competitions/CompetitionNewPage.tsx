import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useCreateCompetitionMutation,
} from '../../../modules/competitions/api/mutations'
import { useCompetitionsQuery } from '../../../modules/competitions/api/queries'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import theme from '../../../theme'

import { CompetitionForm } from './components'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function CompetitionNewPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [, refetchCompetitions] = useCompetitionsQuery()
  const [, createCompetitionMutation] = useCreateCompetitionMutation()

  const canCreate = can('competition.create')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: {
    name: string
    description: string
    matchType: 'SINGLE_LEG' | 'HOME_AND_AWAY'
  }) => {
    setFormError(null)

    if (!canCreate) {
      setFormError('No tienes permiso para crear competiciones')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createCompetitionMutation({
        input: {
          name: data.name,
          description: data.description || undefined,
          matchType: data.matchType,
          participantCount: 8, // default
        },
      })
      if (result.error) {
        setFormError(result.error.message)
        setIsSubmitting(false)
        return
      }
      await refetchCompetitions()
      navigate('/admin/competitions')
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al guardar'))
      setIsSubmitting(false)
    }
  }

  return (
    <div data-testid="competition-new-page">
      <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <div style={{ marginBottom: theme.spacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: theme.spacing.xs }}>Nueva Competición</h2>
          <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
            Completa los datos de la competición
          </p>
        </div>

        <CompetitionForm
          initialData={undefined}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/competitions')}
          error={formError}
          submitLabel="Crear"
        />
      </Panel>
    </div>
  )
}