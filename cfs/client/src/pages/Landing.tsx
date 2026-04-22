import { useNewsQuery, useProductsQuery } from '../graphql/queries'
import NewsCard from '../components/NewsCard'
import ProductCard from '../components/ProductCard'
import type { Product } from '../../../packages/types/generated/graphql'

export default function Landing() {
  const [newsResult] = useNewsQuery()
  const [productsResult] = useProductsQuery()

  const { data: newsData } = newsResult
  const { data: productsData } = productsResult

  const news = newsData?.news ?? []
  const products = productsData?.products ?? []

  // Catalog preview: up to 6 products
  const catalogPreview = products.slice(0, 6)

  return (
    <div data-testid="landing-page" style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem' }}>
      {/* News Feed Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            color: '#d4af37',
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Noticias
        </h2>

        {news.length === 0 ? (
          <p
            data-testid="empty-news"
            style={{
              color: '#a0a0a0',
              fontSize: '1rem',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '2rem',
            }}
          >
            No hay noticias todavía
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        )}
      </section>

      {/* Catalog Preview Section */}
      <section>
        <h2
          style={{
            color: '#d4af37',
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Catálogo
        </h2>

        {catalogPreview.length === 0 ? (
          <p
            style={{
              color: '#a0a0a0',
              fontSize: '1rem',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '2rem',
            }}
          >
            No hay productos disponibles
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.5rem',
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