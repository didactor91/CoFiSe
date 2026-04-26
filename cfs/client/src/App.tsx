import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { useAuth } from './hooks/useAuth'
import AdminLayout from './pages/admin/AdminLayout'
import CompetitionNewPage from './pages/admin/competitions/CompetitionNewPage'
import CompetitionsPage from './pages/admin/competitions/CompetitionsPage'
import Dashboard from './pages/admin/Dashboard'
import EventNewPage from './pages/admin/events/EventNewPage'
import EventsPage from './pages/admin/EventsPage'
import NewsNewPage from './pages/admin/news/NewsNewPage'
import NewsPage from './pages/admin/NewsPage'
import ProductReservationsPage from './pages/admin/ProductReservationsPage'
import ProductsLayoutPage from './pages/admin/ProductsLayoutPage'
import ProductNewPage from './pages/admin/products/ProductNewPage'
import ProductsPage from './pages/admin/ProductsPage'
import UsersPage from './pages/admin/UsersPage'
import Catalog from './pages/Catalog'
import Checkout from './pages/Checkout'
import CompetitionDetail from './pages/competitions/CompetitionDetail'
import EventDetail from './pages/EventDetail'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NewsDetail from './pages/NewsDetail'
import ProductDetail from './pages/ProductDetail'
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
      <Route path="/news/:id" element={<NewsDetail />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/competitions/:id" element={<CompetitionDetail />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsLayoutPage />}>
          <Route index element={<ProductsPage />} />
          <Route path="new" element={<ProductNewPage />} />
          <Route path="reservas" element={<ProductReservationsPage />} />
        </Route>
        <Route path="news" element={<NewsPage />} />
        <Route path="news/new" element={<NewsNewPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/new" element={<EventNewPage />} />
        <Route path="competitions" element={<CompetitionsPage />} />
        <Route path="competitions/new" element={<CompetitionNewPage />} />
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
