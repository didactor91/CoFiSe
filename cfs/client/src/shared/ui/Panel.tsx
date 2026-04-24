import type { CSSProperties, ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  style?: CSSProperties
}

export function Panel({ children, style }: PanelProps) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  )
}

export default Panel
