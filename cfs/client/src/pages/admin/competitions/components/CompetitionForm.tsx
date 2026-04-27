import { useState } from 'react'

import type { MatchType } from '../../../../modules/competitions/api/queries'

interface CompetitionFormProps {
  initialData?: {
    id?: string
    name: string
    description: string
    matchType: MatchType
    participantCount?: number
  }
  onSubmit: (data: { name: string; description: string; matchType: MatchType; participantCount: number }) => Promise<void>
  onCancel: () => void
  error?: string | null
  submitLabel?: string
}

export function CompetitionForm({
  initialData,
  onSubmit,
  onCancel,
  error,
  submitLabel = 'Crear',
}: CompetitionFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [matchType, setMatchType] = useState<MatchType>(initialData?.matchType ?? 'SINGLE_LEG')
  const [participantCount, setParticipantCount] = useState(initialData?.participantCount ?? 8)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!name.trim()) {
      setLocalError('El nombre es requerido')
      return
    }
    if (name.length > 200) {
      setLocalError('El nombre debe tener 200 caracteres o menos')
      return
    }

    await onSubmit({ name: name.trim(), description: description.trim(), matchType, participantCount })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          color: '#64748b',
          fontSize: '0.75rem',
          marginBottom: '0.25rem',
        }}>
          Nombre *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            color: '#0f172a',
            fontSize: '0.875rem',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          color: '#64748b',
          fontSize: '0.75rem',
          marginBottom: '0.25rem',
        }}>
          Descripción (opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            color: '#0f172a',
            fontSize: '0.875rem',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          color: '#64748b',
          fontSize: '0.75rem',
          marginBottom: '0.25rem',
        }}>
          Tipo de partido *
        </label>
        <select
          value={matchType}
          onChange={(e) => setMatchType(e.target.value as MatchType)}
          required
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            color: '#0f172a',
            fontSize: '0.875rem',
          }}
        >
          <option value="SINGLE_LEG">Eliminatoria única</option>
          <option value="HOME_AND_AWAY">Ida y Vuelta</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          color: '#64748b',
          fontSize: '0.75rem',
          marginBottom: '0.25rem',
        }}>
          Número de participantes *
        </label>
        <select
          value={participantCount}
          onChange={(e) => setParticipantCount(Number(e.target.value))}
          required
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            color: '#0f172a',
            fontSize: '0.875rem',
          }}
        >
          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Debe ser potencia de 2 para usar eliminación directa
        </p>
      </div>

      {(error || localError) && (
        <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error || localError}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          className="btn-primary"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default CompetitionForm