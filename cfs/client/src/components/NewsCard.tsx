import type { News } from '../graphql/generated-types'
import theme from '../theme'

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
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <h3
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.lg,
          marginBottom: theme.spacing.xs,
          fontWeight: theme.typography.fontWeight.semibold,
        }}
      >
        {news.title}
      </h3>
      <p
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          marginBottom: theme.spacing.sm,
        }}
      >
        {news.content.substring(0, 100)}
        {news.content.length > 100 ? '...' : ''}
      </p>
      <time
        style={{
          color: theme.colors.accent,
          fontSize: theme.typography.fontSize.xs,
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