import { useNavigate } from 'react-router-dom'
import { useNewsQuery, useProductsQuery, useEventsQuery } from '../graphql/queries'
import NewsCard from '../components/NewsCard'
import theme from '../theme'

export default function Landing() {
  const navigate = useNavigate()
  const [newsResult] = useNewsQuery()
  const [productsResult] = useProductsQuery()
  const [eventsResult] = useEventsQuery()

  const { data: newsData } = newsResult
  const { data: productsData } = productsResult
  const { data: eventsData } = eventsResult

  const news = newsData?.news ?? []
  const products = productsData?.products ?? []
  const events = eventsData?.events ?? []

  // Catalog preview: up to 6 products
  const catalogPreview = products.slice(0, 6)

  return (
    <div data-testid="landing-page" style={{ minHeight: '100vh', background: theme.colors.background, padding: theme.spacing.xl }}>
      {/* News Feed Section */}
      <section style={{ marginBottom: theme.spacing['2xl'] }}>
        <h2
          style={{
            color: theme.colors.accent,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.lg,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Noticias
        </h2>

        {news.length === 0 ? (
          <p
            data-testid="empty-news"
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.base,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: theme.spacing.xl,
            }}
          >
            No hay noticias todavía
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: theme.spacing.lg,
            }}
          >
            {news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Events Section */}
      <section style={{ marginBottom: theme.spacing['2xl'] }}>
        <h2
          style={{
            color: theme.colors.accent,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.lg,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Próximos Eventos
        </h2>

        {events.length === 0 ? (
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.base,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: theme.spacing.xl,
            }}
          >
            No hay eventos programados
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: theme.spacing.lg,
            }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  background: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.lg,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <h3
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  {event.name}
                </h3>
                <p
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  📍 {event.location}
                </p>
                <p
                  style={{
                    color: theme.colors.accent,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                >
                  🗓 {new Date(event.startTime).toLocaleString('es-ES', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                {event.description && (
                  <p
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSize.base,
                      marginTop: theme.spacing.md,
                      lineHeight: 1.5,
                    }}
                  >
                    {event.description.length > 120
                      ? `${event.description.substring(0, 120)}...`
                      : event.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Catalog Preview Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <h2
            style={{
              color: theme.colors.accent,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              fontFamily: theme.typography.fontFamily,
              margin: 0,
            }}
          >
            Catálogo
          </h2>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.accent}`,
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              color: theme.colors.accent,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            Ver todo →
          </button>
        </div>

        {catalogPreview.length === 0 ? (
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.base,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: theme.spacing.xl,
            }}
          >
            No hay productos disponibles
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: theme.spacing.lg,
            }}
          >
            {catalogPreview.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate('/catalog')}
                style={{
                  background: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  border: `1px solid ${theme.colors.border}`,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: theme.borderRadius.sm,
                      marginBottom: theme.spacing.sm,
                    }}
                  />
                )}
                <h3
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    margin: 0,
                  }}
                >
                  {product.name}
                </h3>
                <p
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                    margin: `${theme.spacing.xs} 0`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {product.description}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: theme.spacing.sm,
                  }}
                >
                  <span
                    style={{
                      color: theme.colors.accent,
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.bold,
                    }}
                  >
                    {product.price.toFixed(2)}€
                  </span>
                  <span
                    style={{
                      color: product.stock > 0 ? theme.colors.success : theme.colors.error,
                      fontSize: theme.typography.fontSize.xs,
                    }}
                  >
                    {product.stock > 0 ? 'En stock' : 'Sin stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}