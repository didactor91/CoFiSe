import { useCart } from '../context/CartContext'
import theme from '../theme'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalItems, updateQuantity, removeItem } = useCart()

  if (!isOpen) {
    return null
  }

  const totalPrice = items.reduce(
    (sum, item) => sum + item.productPrice * item.quantity,
    0
  )

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />

      {/* Drawer */}
      <div
        data-testid="cart-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '100%',
          background: theme.colors.surface,
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <h2
            style={{
              color: theme.colors.accent,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              margin: 0,
            }}
          >
            Tu Carrito
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.textSecondary,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.lg,
              padding: theme.spacing.xs,
            }}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: theme.spacing.md,
          }}
        >
          {items.length === 0 ? (
            <p
              style={{
                color: theme.colors.textSecondary,
                textAlign: 'center',
                padding: theme.spacing.xl,
              }}
            >
              Tu carrito está vacío
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  data-testid={`cart-item-${item.id}`}
                  style={{
                    background: theme.colors.background,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                    <span
                      style={{
                        color: theme.colors.text,
                        fontWeight: theme.typography.fontWeight.semibold,
                      }}
                    >
                      {item.productName}
                    </span>
                    <span
                      style={{
                        color: theme.colors.accent,
                        fontWeight: theme.typography.fontWeight.bold,
                      }}
                    >
                      {(item.productPrice * item.quantity).toFixed(2)}€
                    </span>
                  </div>

                  {item.optionValueName && (
                    <div
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.fontSize.sm,
                        marginBottom: theme.spacing.sm,
                      }}
                    >
                      {item.optionValueName}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="-"
                        style={{
                          background: theme.colors.border,
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          color: theme.colors.text,
                          cursor: 'pointer',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: theme.typography.fontWeight.bold,
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          color: theme.colors.text,
                          minWidth: '24px',
                          textAlign: 'center',
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="+"
                        style={{
                          background: theme.colors.border,
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          color: theme.colors.text,
                          cursor: 'pointer',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: theme.typography.fontWeight.bold,
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Eliminar"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.colors.error,
                        cursor: 'pointer',
                        fontSize: theme.typography.fontSize.sm,
                        padding: theme.spacing.xs,
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.md,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.md,
              }}
            >
              <span style={{ color: theme.colors.textSecondary }}>
                {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
              </span>
              <span
                style={{
                  color: theme.colors.accent,
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.bold,
                }}
              >
                Total: {totalPrice.toFixed(2)}€
              </span>
            </div>
            <button
              style={{
                width: '100%',
                padding: theme.spacing.md,
                background: theme.colors.accent,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                color: theme.colors.background,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.bold,
                cursor: 'pointer',
              }}
            >
              Ir al Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}