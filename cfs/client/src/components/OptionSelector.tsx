import theme from '../theme'

export interface OptionValue {
  id: string
  value: string
  stock: number | null
}

export interface ProductOption {
  id: string
  name: string
  type: 'SIZE' | 'COLOR'
  required: boolean
  values: OptionValue[]
}

interface OptionSelectorProps {
  productId: string
  options: ProductOption[]
  onSelect: (optionId: string, valueId: string) => void
  selectedValueId?: string
  error?: string
}

function getStockDisplay(stock: number | null): string {
  if (stock === null) return '∞'
  if (stock === 0) return 'Sin stock'
  return String(stock)
}

function isOutOfStock(stock: number | null): boolean {
  return stock === 0
}

export default function OptionSelector({
  options,
  onSelect,
  selectedValueId,
  error,
}: OptionSelectorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {options.map((option) => (
        <div key={option.id} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <span
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            {option.name}
            {option.required && (
              <span style={{ color: theme.colors.error }}> *</span>
            )}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {option.values.map((value) => {
              const disabled = isOutOfStock(value.stock)
              const selected = value.id === selectedValueId

              return (
                <button
                  key={value.id}
                  type="button"
                  disabled={disabled}
                  data-selected={selected ? 'true' : 'false'}
                  onClick={() => onSelect(option.id, value.id)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.md,
                    border: selected
                      ? `2px solid ${theme.colors.accent}`
                      : `1px solid ${disabled ? theme.colors.disabled : theme.colors.border}`,
                    background: disabled
                      ? theme.colors.disabled
                      : selected
                        ? theme.colors.surface
                        : 'transparent',
                    color: disabled
                      ? theme.colors.disabledText
                      : selected
                        ? theme.colors.accent
                        : theme.colors.text,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  <span>{value.value}</span>
                  <span
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: disabled ? theme.colors.error : theme.colors.textSecondary,
                    }}
                  >
                    {getStockDisplay(value.stock)}
                  </span>
                </button>
              )
            })}
          </div>
          {option.required && !selectedValueId && error && (
            <span
              style={{
                color: theme.colors.error,
                fontSize: theme.typography.fontSize.xs,
                marginTop: theme.spacing.xs,
              }}
            >
              {error}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}