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
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <div key={option.id} className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-600">
            {option.name}
            {option.required && <span className="text-rose-600"> *</span>}
          </span>
          <div className="flex flex-wrap gap-2">
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
                  className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                    disabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70'
                      : selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span>{value.value}</span>
                  <span className={`text-xs ${disabled ? 'text-rose-600' : 'text-slate-500'}`}>
                    {getStockDisplay(value.stock)}
                  </span>
                </button>
              )
            })}
          </div>
          {option.required && !selectedValueId && error && (
            <span className="mt-1 text-xs text-rose-600">{error}</span>
          )}
        </div>
      ))}
    </div>
  )
}
