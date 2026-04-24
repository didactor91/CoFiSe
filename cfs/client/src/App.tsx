import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { useAuth } from './hooks/useAuth'
import Landing from './pages/Landing'
import NewsDetail from './pages/NewsDetail'
import EventDetail from './pages/EventDetail'
import ProductDetail from './pages/ProductDetail'
import Catalog from './pages/Catalog'
import Login from './pages/Login'
import Checkout from './pages/Checkout'
import Verification from './pages/Verification'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ProductsPage from './pages/admin/ProductsPage'
import NewsPage from './pages/admin/NewsPage'
import EventsPage from './pages/admin/EventsPage'
import UsersPage from './pages/admin/UsersPage'

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
      <Route path="/news/:id" element={<NewsDetail />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
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