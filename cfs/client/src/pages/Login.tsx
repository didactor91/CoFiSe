import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import LoginForm from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const handleSuccess = () => {
    navigate('/admin')
  }

  // If already authenticated, redirect to admin (useEffect to avoid setState during render)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div
      data-testid="login-page"
      className="flex min-h-svh items-center justify-center px-4 py-8 sm:px-6"
    >
      <LoginForm onSuccess={handleSuccess} />
    </div>
  )
}
