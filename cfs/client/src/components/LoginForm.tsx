import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { graphqlClient } from '../graphql/client'
import { LOGIN_MUTATION } from '../graphql/mutations'
import { setAuthToken } from '../utils/cookies'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await graphqlClient.mutation(LOGIN_MUTATION, { email, password }).toPromise()

      if (result.error) {
        setError('Credenciales inválidas')
        return
      }

      if (result.data?.login) {
        const { token } = result.data.login
        setAuthToken(token)
        onSuccess?.()
      }
    } catch (err) {
      setError('Credenciales inválidas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '400px',
        margin: '0 auto',
        padding: '2rem',
        background: '#141414',
        borderRadius: '8px',
        border: '1px solid #262626',
      }}
    >
      <h2
        style={{
          color: '#d4af37',
          fontSize: '1.5rem',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        Iniciar Sesión
      </h2>

      {error && (
        <div
          style={{
            color: '#ef4444',
            background: '#1a1a1a',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="email" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            background: '#0a0a0a',
            border: '1px solid #262626',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f5f5f5',
            fontSize: '1rem',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="password" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            background: '#0a0a0a',
            border: '1px solid #262626',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f5f5f5',
            fontSize: '1rem',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !email || !password}
        style={{
          background: isLoading || !email || !password ? '#4a4a4a' : '#d4af37',
          color: isLoading || !email || !password ? '#888' : '#0a0a0a',
          border: 'none',
          borderRadius: '4px',
          padding: '0.75rem',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: isLoading || !email || !password ? 'not-allowed' : 'pointer',
          marginTop: '0.5rem',
        }}
      >
        {isLoading ? 'Cargando...' : 'Entrar'}
      </button>
    </form>
  )
}