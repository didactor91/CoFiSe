import { useState } from 'react'

import { useAuth } from '../context/AuthContext'

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
      className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-lg shadow-slate-200/50 sm:p-8"
    >
      <h2 className="mb-1 text-center text-2xl font-semibold tracking-tight text-slate-900">Iniciar sesión</h2>
      <p className="text-center text-sm text-slate-500">Accede al panel de administración</p>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">{error}</div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="btn-primary mt-2 h-11 w-full"
      >
        {isLoading ? 'Cargando...' : 'Entrar'}
      </button>
    </form>
  )
}
