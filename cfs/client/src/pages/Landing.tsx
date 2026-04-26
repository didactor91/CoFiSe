import { useNavigate } from 'react-router-dom'

import Hero from '../components/landing/Hero'
import Layout from '../components/layout/Layout'
import NewsCard from '../components/NewsCard'
import ProductCard from '../components/ProductCard'
import { useNewsQuery, useProductsQuery, useEventsQuery } from '../graphql/queries'

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
    <Layout>
      <Hero />
      <div className="app-shell space-y-12">
        <section className="space-y-5">
          <h2 className="section-title">Noticias</h2>

          {news.length === 0 ? (
            <p data-testid="empty-news" className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm italic text-slate-500">No hay noticias todavía</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {news.map((item) => (
                <NewsCard key={item.id} news={item} onClick={() => navigate(`/news/${item.id}`)} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <h2 className="section-title">Próximos eventos</h2>

          {events.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm italic text-slate-500">No hay eventos programados</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="card card-hover cursor-pointer"
                >
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{event.name}</h3>
                  <p className="mb-1 text-sm text-slate-500">📍 {event.location}</p>
                  <p className="text-sm font-medium text-slate-700">
                    🗓️ {new Date(event.startTime).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {event.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
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

        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="section-title">Catálogo</h2>
            <button
              onClick={() => navigate('/catalog')}
              className="btn-secondary w-fit"
            >
              Ver todo
            </button>
          </div>

          {catalogPreview.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm italic text-slate-500">No hay productos disponibles</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {catalogPreview.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
