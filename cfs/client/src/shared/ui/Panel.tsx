import type { CSSProperties, ReactNode } from 'react'
import theme from '../../theme'

interface PanelProps {
  children: ReactNode
  style?: CSSProperties
}

export function Panel({ children, style }: PanelProps) {
  return (
    <div
      style={{
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default Panel
