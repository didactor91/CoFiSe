import type { ReactNode } from 'react'

import theme from '../../theme'

interface PageHeaderProps {
  title: string
  action?: ReactNode
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
      <h1
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
        }}
      >
        {title}
      </h1>
      {action}
    </div>
  )
}

export default PageHeader
