import { useCart } from '../context/CartContext'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalItems, updateQuantity, removeItem } = useCart()

  if (!isOpen) {
    return null
  }

  const totalPrice = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0)

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[999] bg-slate-900/45 backdrop-blur-sm" />

      <div
        data-testid="cart-drawer"
        className="fixed top-0 right-0 bottom-0 z-[1000] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-300/40"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="m-0 text-xl font-semibold tracking-tight text-slate-900">Tu carrito</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Tu carrito está vacío
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  data-testid={`cart-item-${item.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{item.productName}</span>
                    <span className="font-semibold text-slate-900">
                      {(item.productPrice * item.quantity).toFixed(2)}€
                    </span>
                  </div>

                  {item.optionValueName && (
                    <div className="mb-2 text-sm text-slate-500">{item.optionValueName}</div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="-"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="min-w-6 text-center text-sm text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="+"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Eliminar"
                      className="text-sm text-rose-600 transition hover:text-rose-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
              </span>
              <span className="text-base font-semibold text-slate-900">
                Total: {totalPrice.toFixed(2)}€
              </span>
            </div>
            <button className="btn-primary w-full">Ir al Checkout</button>
          </div>
        )}
      </div>
    </>
  )
}
