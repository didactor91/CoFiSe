import { useState } from 'react'

import { ReservationStatus } from '../../graphql/generated-types'
import { useAllNewsQuery, useProductsQuery, useReservationsQuery } from '../../graphql/queries'

interface StatCardProps {
  title: string
  value: number | string
  testId: string
}

function StatCard({ title, value, testId }: StatCardProps) {
  return (
    <div
      data-testid={testId}
      className="card text-center"
    >
      <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{title}</div>
    </div>
  )
}

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | null>(null)

  const [newsResult] = useAllNewsQuery()
  const [productsResult] = useProductsQuery()
  const [reservationsResult] = useReservationsQuery({
    status: statusFilter || undefined,
  })

  const news = newsResult.data?.allNews ?? []
  const products = productsResult.data?.products ?? []
  const reservations = reservationsResult.data?.reservations ?? []

  const pendingReservations = reservations.filter((r) => r.status === ReservationStatus.Pending).length

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Noticias" value={news.length} testId="stat-news-count" />
        <StatCard
          title="Reservas Pendientes"
          value={pendingReservations}
          testId="stat-pending-reservations"
        />
        <StatCard title="Productos" value={products.length} testId="stat-product-count" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Noticias recientes</h2>
          <div className="card overflow-hidden p-0">
            {news.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No hay noticias</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {news.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-slate-200 px-4 py-3 text-slate-700 last:border-b-0"
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Reservas recientes</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              data-testid="reservation-filter-pending"
              onClick={() => setStatusFilter(ReservationStatus.Pending)}
              className={statusFilter === ReservationStatus.Pending ? 'btn-primary' : 'btn-secondary'}
            >
              Pendientes
            </button>
            <button
              data-testid="reservation-filter-confirmed"
              onClick={() => setStatusFilter(ReservationStatus.Confirmed)}
              className={statusFilter === ReservationStatus.Confirmed ? 'btn-primary' : 'btn-secondary'}
            >
              Confirmadas
            </button>
            <button
              data-testid="reservation-filter-all"
              onClick={() => setStatusFilter(null)}
              className={statusFilter === null ? 'btn-primary' : 'btn-secondary'}
            >
              Todas
            </button>
          </div>
          <div className="card overflow-hidden p-0">
            {reservations.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No hay reservas</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {reservations.slice(0, 5).map((reservation) => (
                  <li
                    key={reservation.id}
                    className="border-b border-slate-200 px-4 py-3 last:border-b-0"
                  >
                    <div className="font-medium text-slate-800">{reservation.name}</div>
                    <div className="text-sm text-slate-500">
                      {reservation.quantity}x {reservation.product.name} - {reservation.status}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
