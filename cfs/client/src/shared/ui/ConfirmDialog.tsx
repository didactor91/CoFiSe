import type { ReactNode } from 'react'

import { Button } from './Button'
import { Panel } from './Panel'

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
    <Panel style={{ borderColor: '#fecaca' }}>
      <div data-testid={testId}>
        <p className="mb-4 text-slate-700">{message}</p>
        <div className="flex gap-2">
          <Button onClick={onConfirm} variant="danger">{confirmLabel}</Button>
          <Button onClick={onCancel} variant="secondary">{cancelLabel}</Button>
        </div>
      </div>
    </Panel>
  )
}

export default ConfirmDialog
