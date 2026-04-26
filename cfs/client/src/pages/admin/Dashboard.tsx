import { useMemo, useState } from 'react'

import { ReservationStatus } from '../../graphql/generated-types'
import { useUpdateReservationStatusMutation } from '../../graphql/mutations'
import {
  useAllNewsQuery,
  useProductsQuery,
  useReservationMetricsQuery,
  useReservationsQuery,
} from '../../graphql/queries'

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
  const [reservationsResult, reexecuteReservations] = useReservationsQuery()
  const [metricsResult, reexecuteMetrics] = useReservationMetricsQuery()
  const [updateReservationResult, updateReservationStatus] = useUpdateReservationStatusMutation()

  const news = newsResult.data?.allNews ?? []
  const products = productsResult.data?.products ?? []
  const reservations = reservationsResult.data?.reservations ?? []
  const metrics = metricsResult.data?.reservationMetrics

  const filteredReservations = useMemo(() => {
    if (!statusFilter) return reservations
    return reservations.filter((reservation) => reservation.status === statusFilter)
  }, [reservations, statusFilter])

  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === ReservationStatus.Pending).length,
    [reservations]
  )

  const handleUpdateReservationStatus = async (id: string, status: ReservationStatus) => {
    const result = await updateReservationStatus({ id, status })
    if (result.error) return
    reexecuteReservations({ requestPolicy: 'network-only' })
    reexecuteMetrics({ requestPolicy: 'network-only' })
  }

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Noticias" value={news.length} testId="stat-news-count" />
        <StatCard
          title="Reservas Pendientes"
          value={pendingReservations}
          testId="stat-pending-reservations"
        />
        <StatCard title="Productos" value={products.length} testId="stat-product-count" />
        <StatCard
          title="Unidades reservadas"
          value={metrics?.totalUnits ?? 0}
          testId="stat-reserved-units"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
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
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Gestión de reservas</h2>
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
          <div className="card overflow-hidden">
            {filteredReservations.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">No hay reservas</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {filteredReservations.slice(0, 8).map((reservation) => (
                  <li
                    key={reservation.id}
                    className="border-b border-slate-200 px-4 py-3 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-slate-800">{reservation.name}</div>
                      <div className="text-xs text-slate-500">{reservation.status}</div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {reservation.items.length > 0
                        ? reservation.items.map((item) => `${item.quantity}x ${item.productName}${item.optionValue ? ` (${item.optionValue})` : ''}`).join(' · ')
                        : `${reservation.quantity}x ${reservation.product.name}`}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{reservation.createdAt}</div>
                    {reservation.status === ReservationStatus.Pending && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleUpdateReservationStatus(reservation.id, ReservationStatus.Confirmed)}
                          className="btn-primary"
                          disabled={updateReservationResult.fetching}
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleUpdateReservationStatus(reservation.id, ReservationStatus.Cancelled)}
                          className="btn-secondary"
                          disabled={updateReservationResult.fetching}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Histórico por producto</h2>
          <div className="card overflow-hidden p-0">
            {metrics?.byProduct.length ? (
              <ul className="m-0 list-none p-0">
                {metrics.byProduct.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between border-b border-slate-200 px-4 py-3 last:border-b-0">
                    <span className="text-slate-700">{item.productName}</span>
                    <span className="font-semibold text-slate-900">{item.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-sm text-slate-500">Sin datos de histórico</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Histórico por talla</h2>
          <div className="card overflow-hidden p-0">
            {metrics?.bySize.length ? (
              <ul className="m-0 list-none p-0">
                {metrics.bySize.map((item) => (
                  <li key={item.size} className="flex items-center justify-between border-b border-slate-200 px-4 py-3 last:border-b-0">
                    <span className="text-slate-700">{item.size}</span>
                    <span className="font-semibold text-slate-900">{item.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-sm text-slate-500">Sin tallas registradas</p>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Reservas totales: {metrics?.totalReservations ?? 0}
          </p>
        </section>
      </div>
    </div>
  )
}
