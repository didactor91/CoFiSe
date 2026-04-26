import { useState, useMemo } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'

interface Match {
  id: string
  round: number
  position: number
  participant1?: { id: string; alias: string } | null
  participant2?: { id: string; alias: string } | null
  homeScore1?: number | null
  homeScore2?: number | null
  awayScore1?: number | null
  awayScore2?: number | null
  winner?: { id: string; alias: string } | null
  status: string
  isBye: boolean
}

interface MatchResultModalProps {
  match: Match
  matchType: 'SINGLE_LEG' | 'HOME_AND_AWAY'
  onSubmit: (data: {
    homeScore1: number
    homeScore2: number
    awayScore1?: number
    awayScore2?: number
    manualWinnerId?: string
  }) => Promise<void>
  onClose: () => void
}

export function MatchResultModal({ match, matchType, onSubmit, onClose }: MatchResultModalProps) {
  const p1Name = match.participant1?.alias ?? 'BYE'
  const p2Name = match.participant2?.alias ?? 'BYE'

  const [homeScore1, setHomeScore1] = useState(match.homeScore1 ?? '')
  const [homeScore2, setHomeScore2] = useState(match.homeScore2 ?? '')
  const [awayScore1, setAwayScore1] = useState(match.awayScore1 ?? '')
  const [awayScore2, setAwayScore2] = useState(match.awayScore2 ?? '')
  const [manualWinnerId, setManualWinnerId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const aggregate = useMemo(() => {
    if (matchType !== 'HOME_AND_AWAY') return null
    const h1 = homeScore1 === '' ? 0 : Number(homeScore1)
    const h2 = homeScore2 === '' ? 0 : Number(homeScore2)
    const a1 = awayScore1 === '' ? 0 : Number(awayScore1)
    const a2 = awayScore2 === '' ? 0 : Number(awayScore2)
    return { p1: h1 + a2, p2: h2 + a1 }
  }, [homeScore1, homeScore2, awayScore1, awayScore2, matchType])

  const isSingleLegTied = matchType === 'SINGLE_LEG' && homeScore1 !== '' && homeScore2 !== '' && Number(homeScore1) === Number(homeScore2)
  const isHomeAwayTied = matchType === 'HOME_AND_AWAY' && aggregate && aggregate.p1 === aggregate.p2
  const isTied = isSingleLegTied || isHomeAwayTied

  const handleSubmit = async () => {
    setError(null)

    const h1 = homeScore1 === '' ? undefined : Number(homeScore1)
    const h2 = homeScore2 === '' ? undefined : Number(homeScore2)

    if (h1 === undefined || h2 === undefined) {
      setError('Los resultados locales son requeridos')
      return
    }

    if (matchType === 'HOME_AND_AWAY') {
      const a1 = awayScore1 === '' ? undefined : Number(awayScore1)
      const a2 = awayScore2 === '' ? undefined : Number(awayScore2)

      if (a1 === undefined || a2 === undefined) {
        setError('Los resultados de ida son requeridos')
        return
      }

      // Check if tied and manual winner needed
      if (h1 + a2 === h2 + a1 && !manualWinnerId && !match.winner) {
        setError('Empate - selecciona un ganador manualmente')
        return
      }

      setIsSubmitting(true)
      try {
        await onSubmit({
          homeScore1: h1,
          homeScore2: h2,
          awayScore1: a1,
          awayScore2: a2,
          manualWinnerId: isTied ? manualWinnerId : undefined,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // SINGLE_LEG: check for tie
      if (h1 === h2 && !manualWinnerId && !match.winner) {
        setError('Empate - selecciona un ganador manualmente')
        return
      }

      setIsSubmitting(true)
      try {
        await onSubmit({
          homeScore1: h1,
          homeScore2: h2,
          manualWinnerId: isSingleLegTied ? manualWinnerId : undefined,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <Panel
        style={{ maxWidth: 480, width: '100%', margin: '1rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
          Introducir resultado
        </h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}>
            <span style={{ textAlign: 'center', fontWeight: 500, fontSize: '0.875rem' }}>{p1Name}</span>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Local</span>
            <span style={{ textAlign: 'center', fontWeight: 500, fontSize: '0.875rem' }}>{p2Name}</span>
          </div>

          {/* Local scores */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 60px 1fr',
            gap: '0.5rem',
            alignItems: 'center',
          }}>
            <div />
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Goles
              </label>
              <input
                type="number"
                min="0"
                value={homeScore1}
                onChange={(e) => setHomeScore1(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Goles
              </label>
              <input
                type="number"
                min="0"
                value={homeScore2}
                onChange={(e) => setHomeScore2(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                }}
              />
            </div>
            <div />
          </div>
        </div>

        {/* Away scores for HOME_AND_AWAY */}
        {matchType === 'HOME_AND_AWAY' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}>
              <span style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>Equipo local (ida)</span>
              <span />
              <span style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>Equipo visitante (ida)</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px 60px 1fr',
              gap: '0.5rem',
              alignItems: 'center',
            }}>
              <div />
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  Goles
                </label>
                <input
                  type="number"
                  min="0"
                  value={awayScore1}
                  onChange={(e) => setAwayScore1(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  Goles
                </label>
                <input
                  type="number"
                  min="0"
                  value={awayScore2}
                  onChange={(e) => setAwayScore2(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                  }}
                />
              </div>
              <div />
            </div>

            {/* Aggregate display */}
            {aggregate && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: '#f1f5f9',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: '#64748b' }}>Agregado: </span>
                <span style={{ fontWeight: 600 }}>{aggregate.p1} - {aggregate.p2}</span>
                {isTied && (
                  <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>Empate</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual winner selection for tied matches (both SINGLE_LEG and HOME_AND_AWAY) */}
        {isTied && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#64748b',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
            }}>
              Empate - Seleccionar ganador manualmente *
            </label>
            <select
              value={manualWinnerId}
              onChange={(e) => setManualWinnerId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            >
              <option value="">Seleccionar ganador</option>
              {match.participant1 && (
                <option value={match.participant1.id}>{match.participant1.alias}</option>
              )}
              {match.participant2 && (
                <option value={match.participant2.id}>{match.participant2.alias}</option>
              )}
            </select>
          </div>
        )}

        {error && (
          <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar resultado'}
          </Button>
        </div>
      </Panel>
    </div>
  )
}

export default MatchResultModal