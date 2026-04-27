import { useNavigate } from 'react-router-dom'

import Layout from '../../components/layout/Layout'
import NewsCard from '../../components/NewsCard'
import { useNewsQuery } from '../../modules/news/api/queries'

export default function NewsList() {
  const navigate = useNavigate()
  const [result] = useNewsQuery()
  const { data } = result
  const news = data?.news ?? []

  return (
    <Layout>
      <div className="app-shell space-y-12">
        <section className="space-y-5">
          <h2 className="section-title">Noticias</h2>

          {news.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm italic text-slate-500">
              No hay noticias todavía
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {news.map((item) => (
                <NewsCard
                  key={item.id}
                  news={item}
                  onClick={() => navigate(`/news/${item.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}