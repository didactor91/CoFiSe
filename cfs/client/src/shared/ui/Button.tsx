import type { ButtonHTMLAttributes, ReactNode } from 'react'

import theme from '../../theme'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
}

export function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  const palette = {
    primary: { background: theme.colors.accent, color: theme.colors.background },
    secondary: { background: theme.colors.border, color: theme.colors.text },
    danger: { background: theme.colors.error, color: '#fff' },
    ghost: { background: 'transparent', color: theme.colors.accent, border: `1px solid ${theme.colors.accent}` },
  }[variant]

  return (
    <button
      {...props}
      style={{
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        border: variant === 'ghost' ? palette.border : 'none',
        borderRadius: theme.borderRadius.sm,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.sm,
        background: palette.background,
        color: palette.color,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export default Button
