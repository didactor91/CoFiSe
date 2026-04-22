import { News } from '../../../packages/types/generated/graphql'

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
      style={{
        background: '#141414',
        borderRadius: '8px',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid #262626',
      }}
    >
      <h3
        style={{
          color: '#f5f5f5',
          fontSize: '1.25rem',
          marginBottom: '0.5rem',
          fontWeight: 600,
        }}
      >
        {news.title}
      </h3>
      <p
        style={{
          color: '#a0a0a0',
          fontSize: '0.875rem',
          marginBottom: '0.75rem',
        }}
      >
        {news.content.substring(0, 100)}
        {news.content.length > 100 ? '...' : ''}
      </p>
      <time
        style={{
          color: '#d4af37',
          fontSize: '0.75rem',
          fontStyle: 'italic',
        }}
        dateTime={news.createdAt}
      >
        {formattedDate}
      </time>
    </article>
  )
}

// Export a version with proper testid for the grid
export function NewsCardGrid({ items }: { items: News[] }) {
  return (
    <div data-testid="news-card" style={{ display: 'none' }}>
      {items.map((news) => (
        <NewsCard key={news.id} news={news} />
      ))}
    </div>
  )
}