import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
}

export function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  const classes = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger:
      'rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200',
    ghost:
      'rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200',
  }[variant]

  return (
    <button
      {...props}
      className={classes}
      style={{
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export default Button
