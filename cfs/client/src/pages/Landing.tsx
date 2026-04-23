import { useNewsQuery, useProductsQuery, useEventsQuery } from '../graphql/queries'
import NewsCard from '../components/NewsCard'
import ProductCard from '../components/ProductCard'
import type { Product } from '../graphql/generated-types'
import theme from '../theme'

export default function Landing() {
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
        <h2
          style={{
            color: theme.colors.accent,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.lg,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Catálogo
        </h2>

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
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}