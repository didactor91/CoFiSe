import { useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const handleSuccess = () => {
    navigate('/admin')
  }

  // If already authenticated, redirect to admin
  if (isAuthenticated) {
    navigate('/admin', { replace: true })
    return null
  }

  return (
    <div
      data-testid="login-page"
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <LoginForm onSuccess={handleSuccess} />
    </div>
  )
}