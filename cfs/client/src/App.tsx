import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { useAuth } from './hooks/useAuth'
import Landing from './pages/Landing'
import Catalog from './pages/Catalog'
import ControlPanel from './pages/ControlPanel'
import Login from './pages/Login'
import Checkout from './pages/Checkout'
import Verification from './pages/Verification'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    // During auth initialization, don't redirect - wait for result
    return null
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/login" element={<Login />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/verification" element={<Verification />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <ControlPanel />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App