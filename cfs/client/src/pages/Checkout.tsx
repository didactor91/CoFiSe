import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import theme from '../theme'
import { useMutation } from 'urql'

interface CartItem {
  id: string
  productId: string
  productName: string
  productPrice: number
  optionValueId: string | null
  optionValueName: string | null
  quantity: number
}

// GraphQL mutation for checkout
const SUBMIT_CART_FOR_VERIFICATION_MUTATION = `
  mutation SubmitCartForVerification($input: CheckoutInput!) {
    submitCartForVerification(input: $input) {
      success
      message
      reservationId
      demoCode
    }
  }
`

type CheckoutStep = 'cart-review' | 'contact-form' | 'verification' | 'confirmation'

interface ContactFormData {
  name: string
  email: string
  phone: string
  notes: string
  website: string // honeypot
  formRenderTime: number
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, totalItems } = useCart()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart-review')
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    website: '',
    formRenderTime: 0,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)

  // Submit cart mutation
  const [submitCartResult, submitCart] = useMutation(SUBMIT_CART_FOR_VERIFICATION_MUTATION)

  // Empty cart guard
  if (items.length === 0 && currentStep === 'cart-review') {
    return (
      <div
        data-testid="checkout-page"
        style={{
          minHeight: '100vh',
          background: theme.colors.background,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
            }}
          >
            🛒
          </div>
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: '1rem',
            }}
          >
            Tu carrito está vacío
          </h2>
          <p
            style={{
              color: theme.colors.textSecondary,
              marginBottom: '1.5rem',
            }}
          >
            Añade productos al carrito antes de hacer el checkout
          </p>
          <Link
            to="/catalog"
            style={{
              display: 'inline-block',
              background: theme.colors.accent,
              color: theme.colors.background,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              textDecoration: 'none',
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity)
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId)
  }

  const handleContinueToContact = () => {
    setCurrentStep('contact-form')
    // Record form render timestamp when step 2 mounts
    setFormData(prev => ({ ...prev, formRenderTime: Date.now() }))
  }

  const handleContactFormChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  const validateContactForm = (): boolean => {
    if (!formData.name.trim()) {
      setFormError('Nombre es obligatorio')
      return false
    }
    if (!formData.email.trim()) {
      setFormError('Email es obligatorio')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setFormError('Email inválido')
      return false
    }
    if (!formData.phone.trim()) {
      setFormError('Teléfono es obligatorio')
      return false
    }
    // Honeypot check - if website field has value, it's a bot
    if (formData.website.trim()) {
      setFormError('Por favor, completa el formulario correctamente')
      return false
    }
    // Timing check - less than 3 seconds is suspicious
    const timeDiff = (Date.now() - formData.formRenderTime) / 1000
    if (timeDiff < 3) {
      setFormError('Por favor, revisa el formulario antes de enviar')
      return false
    }
    return true
  }

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateContactForm()) {
      return
    }

    const cartItems = items.map(item => ({
      productId: item.productId,
      optionValueId: item.optionValueId,
      quantity: item.quantity,
      unitPrice: item.productPrice,
    }))

    const result = await submitCart({
      input: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        website: formData.website, // honeypot - server will check
        formRenderTime: formData.formRenderTime,
        items: cartItems,
      },
    })

    if (result.error) {
      setFormError('Algo salió mal, por favor intenta más tarde')
      return
    }

    const data = result.data?.submitCartForVerification
    if (data?.success) {
      setReservationId(data.reservationId)
      setDemoCode(data.demoCode)
      setCurrentStep('verification')
    } else {
      setFormError(data?.message || 'Algo salió mal, por favor intenta más tarde')
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (codeInput.length !== 4) {
      setVerificationError('Código debe tener 4 dígitos')
      return
    }

    // Mock verification for demo - in real app would call GraphQL mutation
    // For now, just check if code matches demoCode
    if (codeInput === demoCode) {
      setCurrentStep('confirmation')
    } else {
      const remaining = attemptsRemaining - 1
      setAttemptsRemaining(remaining)
      setVerificationError('Código incorrecto')
      setCodeInput('')
      
      if (remaining <= 0) {
        setVerificationError('Ha ocurrido un error, por favor inicia el proceso de nuevo')
        // In real app, would cancel reservation here
      }
    }
  }

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + item.productPrice * item.quantity,
      0
    )
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)}€`
  }

  // Step 1: Cart Review
  if (currentStep === 'cart-review') {
    return (
      <div
        data-testid="checkout-page"
        style={{
          minHeight: '100vh',
          background: theme.colors.background,
          padding: '2rem',
        }}
      >
        <h1
          style={{
            color: theme.colors.accent,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: '2rem',
          }}
        >
          Checkout
        </h1>

        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '1.5rem',
            border: `1px solid ${theme.colors.border}`,
            marginBottom: '1.5rem',
          }}
        >
          <h2
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: '1rem',
            }}
          >
            Revisa tu carrito
          </h2>

          {items.length === 0 ? (
            <p style={{ color: theme.colors.textSecondary }}>
              Tu carrito está vacío
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  data-testid={`cart-item-${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: theme.colors.background,
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: theme.colors.text, fontWeight: 500 }}>
                      {item.productName}
                    </div>
                    {item.optionValueName && (
                      <div style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
                        {item.optionValueName}
                      </div>
                    )}
                    <div style={{ color: theme.colors.accent, marginTop: '0.25rem' }}>
                      {formatPrice(item.productPrice)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        color: theme.colors.text,
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>
                    <span
                      data-testid={`quantity-${item.id}`}
                      style={{
                        color: theme.colors.text,
                        minWidth: '24px',
                        textAlign: 'center',
                      }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        color: theme.colors.text,
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${theme.colors.error}`,
                        borderRadius: theme.borderRadius.sm,
                        color: theme.colors.error,
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        marginLeft: '0.5rem',
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

        {/* Total and continue */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '1.5rem',
            border: `1px solid ${theme.colors.border}`,
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <span style={{ color: theme.colors.textSecondary }}>Total: </span>
            <span
              style={{
                color: theme.colors.accent,
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
              }}
            >
              {formatPrice(calculateTotal())}
            </span>
          </div>
          <button
            onClick={handleContinueToContact}
            disabled={items.length === 0}
            style={{
              background: items.length === 0 ? theme.colors.disabled : theme.colors.accent,
              color: items.length === 0 ? theme.colors.disabledText : theme.colors.background,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Continuar
          </button>
        </div>

        <Link
          to="/catalog"
          style={{
            color: theme.colors.textSecondary,
            textDecoration: 'none',
          }}
        >
          ← Volver al catálogo
        </Link>
      </div>
    )
  }

  // Step 2: Contact Form
  if (currentStep === 'contact-form') {
    return (
      <div
        data-testid="checkout-page"
        style={{
          minHeight: '100vh',
          background: theme.colors.background,
          padding: '2rem',
        }}
      >
        <h1
          style={{
            color: theme.colors.accent,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: '2rem',
          }}
        >
          Datos de contacto
        </h1>

        <form
          onSubmit={handleContactFormSubmit}
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '1.5rem',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {/* Honeypot field - hidden from users, visible to bots */}
          <div style={{ display: 'none' }}>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={(e) => handleContactFormChange('website', e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Hidden form render time */}
          <input
            type="hidden"
            name="formRenderTime"
            value={formData.formRenderTime}
          />

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                color: theme.colors.text,
                marginBottom: '0.5rem',
              }}
            >
              Nombre *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleContactFormChange('name', e.target.value)}
              required
              style={{
                width: '100%',
                padding: theme.spacing.md,
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.base,
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                color: theme.colors.text,
                marginBottom: '0.5rem',
              }}
            >
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleContactFormChange('email', e.target.value)}
              required
              style={{
                width: '100%',
                padding: theme.spacing.md,
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.base,
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="phone"
              style={{
                display: 'block',
                color: theme.colors.text,
                marginBottom: '0.5rem',
              }}
            >
              Teléfono *
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleContactFormChange('phone', e.target.value)}
              required
              style={{
                width: '100%',
                padding: theme.spacing.md,
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.base,
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="notes"
              style={{
                display: 'block',
                color: theme.colors.text,
                marginBottom: '0.5rem',
              }}
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleContactFormChange('notes', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.base,
                resize: 'vertical',
              }}
            />
          </div>

          {formError && (
            <div
              style={{
                background: theme.colors.error,
                color: 'white',
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                marginBottom: '1rem',
              }}
              role="alert"
            >
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setCurrentStep('cart-review')}
              style={{
                flex: 1,
                padding: theme.spacing.md,
                background: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                cursor: 'pointer',
              }}
            >
              Atrás
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: theme.spacing.md,
                background: theme.colors.accent,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                color: theme.colors.background,
                fontWeight: theme.typography.fontWeight.bold,
                cursor: 'pointer',
              }}
            >
              Continuar
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Step 3: Verification
  if (currentStep === 'verification') {
    return (
      <div
        data-testid="checkout-page"
        style={{
          minHeight: '100vh',
          background: theme.colors.background,
          padding: '2rem',
        }}
      >
        <h1
          style={{
            color: theme.colors.accent,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: '2rem',
          }}
        >
          Verificación
        </h1>

        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '1.5rem',
            border: `1px solid ${theme.colors.border}`,
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: theme.colors.textSecondary,
              marginBottom: '1rem',
            }}
          >
            Tu código de verificación es:
          </p>
          <div
            data-testid="demo-code"
            style={{
              fontSize: '2.5rem',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.accent,
              letterSpacing: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            {demoCode}
          </div>
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            En producción, este código se enviaría a tu email
          </p>
        </div>

        <form
          onSubmit={handleVerificationSubmit}
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '1.5rem',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <label
              htmlFor="code"
              style={{
                display: 'block',
                color: theme.colors.text,
                marginBottom: '0.5rem',
              }}
            >
              Introduce el código de verificación
            </label>
            <input
              id="code"
              type="text"
              maxLength={4}
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))
                setVerificationError(null)
              }}
              placeholder="____"
              style={{
                width: '120px',
                padding: theme.spacing.md,
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.xl,
                textAlign: 'center',
                letterSpacing: '0.5rem',
              }}
            />
            <div
              data-testid="attempts-counter"
              style={{
                color: theme.colors.textSecondary,
                marginTop: '0.5rem',
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              {attemptsRemaining} intentos restantes
            </div>
          </div>

          {verificationError && (
            <div
              data-testid="verification-error"
              style={{
                background: theme.colors.error,
                color: 'white',
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                marginBottom: '1rem',
                textAlign: 'center',
              }}
              role="alert"
            >
              {verificationError}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: theme.spacing.md,
              background: theme.colors.accent,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              color: theme.colors.background,
              fontWeight: theme.typography.fontWeight.bold,
              cursor: 'pointer',
            }}
          >
            Verificar
          </button>
        </form>
      </div>
    )
  }

  // Step 4: Confirmation
  if (currentStep === 'confirmation') {
    return (
      <div
        data-testid="checkout-page"
        style={{
          minHeight: '100vh',
          background: theme.colors.background,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              marginBottom: '1rem',
            }}
          >
            ✓
          </div>
          <h1
            style={{
              color: theme.colors.accent,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: '1rem',
            }}
          >
            ¡Reserva confirmada!
          </h1>
          <p
            style={{
              color: theme.colors.textSecondary,
              marginBottom: '0.5rem',
            }}
          >
            Tu ID de reserva:
          </p>
          <div
            data-testid="reservation-id"
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: '1.5rem',
            }}
          >
            {reservationId}
          </div>
          <Link
            to="/catalog"
            style={{
              display: 'inline-block',
              background: theme.colors.accent,
              color: theme.colors.background,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              textDecoration: 'none',
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return null
}