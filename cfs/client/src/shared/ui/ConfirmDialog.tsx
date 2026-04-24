import type { ReactNode } from 'react'

import { Button } from './Button'
import { Panel } from './Panel'
import theme from '../../theme'

interface ConfirmDialogProps {
  message: ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  testId?: string
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  testId,
}: ConfirmDialogProps) {
  return (
    <Panel
      style={{
        border: `1px solid ${theme.colors.error}`,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
      }}
    >
      <div data-testid={testId}>
        <p style={{ color: theme.colors.text, marginBottom: theme.spacing.md }}>{message}</p>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <Button onClick={onConfirm} variant="danger">{confirmLabel}</Button>
          <Button onClick={onCancel} variant="secondary">{cancelLabel}</Button>
        </div>
      </div>
    </Panel>
  )
}

export default ConfirmDialog
