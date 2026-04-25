import { NavLink, Outlet } from 'react-router-dom'

export default function ProductsLayoutPage() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'btn-primary text-center' : 'btn-secondary text-center'

  return (
    <div data-testid="products-layout-page">
      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <NavLink to="/admin/products" end className={tabClass}>
          Gestión de Productos
        </NavLink>
        <NavLink to="/admin/products/reservas" className={tabClass}>
          Gestión de Reservas
        </NavLink>
      </div>
      <Outlet />
    </div>
  )
}
