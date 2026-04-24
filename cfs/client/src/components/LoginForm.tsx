import { useState } from 'react'

import { useAuth } from '../context/AuthContext'
import theme from '../theme'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      onSuccess?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas')
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = isLoading || !email || !password

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
        maxWidth: '400px',
        margin: '0 auto',
        padding: theme.spacing.xl,
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <h2
        style={{
          color: theme.colors.accent,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
          textAlign: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        Iniciar Sesión
      </h2>

      {error && (
        <div
          style={{
            color: theme.colors.error,
            background: '#1a1a1a',
            padding: theme.spacing.sm,
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.sm,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <label htmlFor="email" style={{ color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            background: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.sm,
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.base,
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <label htmlFor="password" style={{ color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            background: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.sm,
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.base,
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        style={{
          background: isDisabled ? theme.colors.disabled : theme.colors.accent,
          color: isDisabled ? theme.colors.disabledText : theme.colors.background,
          border: 'none',
          borderRadius: theme.borderRadius.sm,
          padding: theme.spacing.sm,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          marginTop: theme.spacing.xs,
        }}
      >
        {isLoading ? 'Cargando...' : 'Entrar'}
      </button>
    </form>
  )
}
