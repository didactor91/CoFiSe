import type { News } from '../graphql/generated-types'

interface NewsCardProps {
  news: News
  onClick?: () => void
}

export default function NewsCard({ news, onClick }: NewsCardProps) {
  const formattedDate = new Date(news.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article
      data-testid={`news-card-${news.id}`}
      data-testid-base="news-card"
      onClick={onClick}
      className={`card h-full ${onClick ? 'card-hover cursor-pointer' : ''}`}
    >
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{news.title}</h3>
      <p className="mb-3 text-sm leading-6 text-slate-600">
        {news.content.substring(0, 100)}
        {news.content.length > 100 ? '...' : ''}
      </p>
      <time className="text-xs font-medium text-slate-500" dateTime={news.createdAt}>
        {formattedDate}
      </time>
    </article>
  )
}

// Export a version with proper testid for the grid
export function NewsCardGrid({ items }: { items: News[] }) {
  return (
    <div data-testid="news-card" className="hidden">
      {items.map((news) => (
        <NewsCard key={news.id} news={news} />
      ))}
    </div>
  )
}
