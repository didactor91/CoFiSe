import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import theme from '../theme'
import { useMutation } from 'urql'

// GraphQL mutation for code verification
const VERIFY_RESERVATION_CODE_MUTATION = `
  mutation VerifyReservationCode($reservationId: ID!, $code: String!) {
    verifyReservationCode(reservationId: $reservationId, code: $code) {
      success
      message
    }
  }
`

export default function Verification() {
  const [searchParams] = useSearchParams()
  const reservationId = searchParams.get('reservationId')
  
  const [codeInput, setCodeInput] = useState('')
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  // Verify code mutation
  const [verifyCodeResult, verifyCode] = useMutation(VERIFY_RESERVATION_CODE_MUTATION)

  // If no reservationId, show error
  if (!reservationId) {
    return (
      <div
        data-testid="verification-page"
        style={{
          minHeight: '100vh',
          background: theme.colors.background,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h2
            style={{
              color: theme.colors.error,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: '1rem',
            }}
          >
            Error
          </h2>
          <p
            style={{
              color: theme.colors.textSecondary,
              marginBottom: '1.5rem',
            }}
          >
            No se proporcionó ID de reserva
          </p>
          <Link
            to="/catalog"
            style={{
              display: 'inline-block',
              background: theme.colors.accent,
              color: theme.colors.background,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              textDecoration: 'none',
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  // Demo: if we were passed a demo code in real scenario, it would come from URL
  // For demo purposes, we'll use a mock
  useEffect(() => {
    // In production, this would be fetched from the server based on reservationId
    // For demo, we'll use a placeholder
    if (reservationId && !demoCode) {
      // This would normally be set when the reservation was created
      // For demo, we'll simulate showing a code
      setDemoCode('1234')
    }
  }, [reservationId, demoCode])

  const handleCodeChange = (value: string) => {
    // Only allow digits, max 4
    const cleaned = value.replace(/\D/g, '').slice(0, 4)
    setCodeInput(cleaned)
    setVerificationError(null)
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (codeInput.length !== 4) {
      setVerificationError('Código debe tener 4 dígitos')
      return
    }

    if (!demoCode) {
      setVerificationError('Código no disponible')
      return
    }

    // Demo verification: check against demoCode
    // In production, this would call the GraphQL mutation
    if (codeInput === demoCode) {
      setIsVerified(true)
    } else {
      const remaining = attemptsRemaining - 1
      setAttemptsRemaining(remaining)
      setVerificationError('Código incorrecto')
      setCodeInput('')
      
      if (remaining <= 0) {
        setVerificationError('Ha ocurrido un error, por favor inicia el proceso de nuevo')
        // In real app, would cancel reservation here
      }
    }
  }

  // Verification success - redirect to confirmation
  if (isVerified) {
    return (
      <div
        data-testid="verification-page"
        style={{
          minHeight: '100vh',
          background: theme.colors.background,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              marginBottom: '1rem',
            }}
          >
            ✓
          </div>
          <h1
            style={{
              color: theme.colors.accent,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: '1rem',
            }}
          >
            ¡Verificación exitosa!
          </h1>
          <p
            style={{
              color: theme.colors.textSecondary,
              marginBottom: '1.5rem',
            }}
          >
            Tu reserva ha sido confirmada
          </p>
          <Link
            to="/catalog"
            style={{
              display: 'inline-block',
              background: theme.colors.accent,
              color: theme.colors.background,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              textDecoration: 'none',
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  // All attempts exhausted
  if (attemptsRemaining <= 0) {
    return (
      <div
        data-testid="verification-page"
        style={{
          minHeight: '100vh',
          background: theme.colors.background,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h2
            style={{
              color: theme.colors.error,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: '1rem',
            }}
          >
            Límite de intentos excedido
          </h2>
          <p
            style={{
              color: theme.colors.textSecondary,
              marginBottom: '1.5rem',
            }}
          >
            Ha ocurrido un error, por favor inicia el proceso de nuevo
          </p>
          <Link
            to="/catalog"
            style={{
              display: 'inline-block',
              background: theme.colors.accent,
              color: theme.colors.background,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              textDecoration: 'none',
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  // Verification form
  return (
    <div
      data-testid="verification-page"
      style={{
        minHeight: '100vh',
        background: theme.colors.background,
        padding: '2rem',
      }}
    >
      <h1
        style={{
          color: theme.colors.accent,
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        Verificación
      </h1>

      <div
        style={{
          background: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: '1.5rem',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            color: theme.colors.textSecondary,
            marginBottom: '1rem',
          }}
        >
          Tu código de verificación es:
        </p>
        <div
          data-testid="demo-code"
          style={{
            fontSize: '2.5rem',
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.accent,
            letterSpacing: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          {demoCode || '____'}
        </div>
        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          En producción, este código se enviaría a tu email
        </p>
      </div>

      <form
        onSubmit={handleVerificationSubmit}
        style={{
          background: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: '1.5rem',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <label
            htmlFor="code"
            style={{
              display: 'block',
              color: theme.colors.text,
              marginBottom: '0.5rem',
            }}
          >
            Introduce el código de verificación
          </label>
          <input
            id="code"
            type="text"
            maxLength={4}
            value={codeInput}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="____"
            data-testid="code-input"
            style={{
              width: '120px',
              padding: theme.spacing.md,
              background: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.xl,
              textAlign: 'center',
              letterSpacing: '0.5rem',
            }}
          />
          <div
            data-testid="attempts-counter"
            style={{
              color: theme.colors.textSecondary,
              marginTop: '0.5rem',
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            {attemptsRemaining} {attemptsRemaining === 1 ? 'intento' : 'intentos'} restantes
          </div>
        </div>

        {verificationError && (
          <div
            data-testid="verification-error"
            style={{
              background: theme.colors.error,
              color: 'white',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              marginBottom: '1rem',
              textAlign: 'center',
            }}
            role="alert"
          >
            {verificationError}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: theme.spacing.md,
            background: theme.colors.accent,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            color: theme.colors.background,
            fontWeight: theme.typography.fontWeight.bold,
            cursor: 'pointer',
          }}
        >
          Verificar
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Link
          to="/checkout"
          style={{
            color: theme.colors.textSecondary,
            textDecoration: 'none',
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          ← Volver al checkout
        </Link>
      </div>
    </div>
  )
}