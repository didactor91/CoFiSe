import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAllNewsQuery, useProductsQuery, useReservationsQuery } from '../../graphql/queries'
import { ReservationStatus } from '../../graphql/generated-types'
import theme from '../../theme'

interface StatCardProps {
  title: string
  value: number | string
  testId: string
}

function StatCard({ title, value, testId }: StatCardProps) {
  return (
    <div
      data-testid={testId}
      style={{
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        border: `1px solid ${theme.colors.border}`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: theme.colors.accent,
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          marginTop: theme.spacing.xs,
        }}
      >
        {title}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
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
      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing['2xl'],
        }}
      >
        <StatCard title="Noticias" value={news.length} testId="stat-news-count" />
        <StatCard
          title="Reservas Pendientes"
          value={pendingReservations}
          testId="stat-pending-reservations"
        />
        <StatCard title="Productos" value={products.length} testId="stat-product-count" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.xl }}>
        {/* Recent News Section */}
        <section>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
            }}
          >
            Noticias Recientes
          </h2>
          <div
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              overflow: 'hidden',
            }}
          >
            {news.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
                No hay noticias
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {news.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    style={{
                      padding: theme.spacing.md,
                      borderBottom: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text,
                    }}
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Recent Reservations Section */}
        <section>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
            }}
          >
            Reservas Recientes
          </h2>
          <div style={{ display: 'flex', gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
            <button
              data-testid="reservation-filter-pending"
              onClick={() => setStatusFilter(ReservationStatus.Pending)}
              style={{
                background: statusFilter === ReservationStatus.Pending ? theme.colors.accent : theme.colors.border,
                color: statusFilter === ReservationStatus.Pending ? theme.colors.background : theme.colors.text,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Pendientes
            </button>
            <button
              data-testid="reservation-filter-confirmed"
              onClick={() => setStatusFilter(ReservationStatus.Confirmed)}
              style={{
                background: statusFilter === ReservationStatus.Confirmed ? theme.colors.accent : theme.colors.border,
                color: statusFilter === ReservationStatus.Confirmed ? theme.colors.background : theme.colors.text,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Confirmadas
            </button>
            <button
              data-testid="reservation-filter-all"
              onClick={() => setStatusFilter(null)}
              style={{
                background: statusFilter === null ? theme.colors.accent : theme.colors.border,
                color: statusFilter === null ? theme.colors.background : theme.colors.text,
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              Todas
            </button>
          </div>
          <div
            style={{
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              overflow: 'hidden',
            }}
          >
            {reservations.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
                No hay reservas
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {reservations.slice(0, 5).map((reservation) => (
                  <li
                    key={reservation.id}
                    style={{
                      padding: theme.spacing.md,
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div style={{ color: theme.colors.text, fontWeight: theme.typography.fontWeight.medium }}>
                      {reservation.name}
                    </div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
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