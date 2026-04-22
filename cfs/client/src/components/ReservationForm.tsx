import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { useCreateReservationMutation } from '../graphql/mutations'
import type { Product } from '../../../packages/types/generated/graphql'

interface ReservationFormProps {
  product: Product
  onSuccess?: () => void
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  quantity?: string
}

export default function ReservationForm({ product, onSuccess }: ReservationFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [, createReservation] = useCreateReservationMutation()

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Nombre requerido'
    }

    if (!email.trim()) {
      newErrors.email = 'Email requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email válido requerido'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Teléfono requerido'
    } else if (phone.length < 9) {
      newErrors.phone = 'Mínimo 9 caracteres'
    }

    if (quantity < 1) {
      newErrors.quantity = 'Cantidad mínima 1'
    } else if (quantity > product.stock) {
      newErrors.quantity = `Stock máximo: ${product.stock}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) return

    try {
      const result = await createReservation({
        input: {
          productId: product.id,
          quantity,
          name,
          email,
          phone,
          notes: notes || undefined,
        },
      })

      if (result.error) {
        setSubmitError(result.error.message)
        return
      }

      onSuccess?.()
    } catch (err) {
      setSubmitError('Error al crear la reserva')
    }
  }

  const isFormValid = name.trim() && email.trim() && phone.length >= 9 && quantity >= 1

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="reservation-form"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '500px',
        margin: '0 auto',
        padding: '2rem',
        background: '#141414',
        borderRadius: '8px',
        border: '1px solid #262626',
      }}
    >
      <h2
        style={{
          color: '#d4af37',
          fontSize: '1.5rem',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        Reservar: {product.name}
      </h2>

      {submitError && (
        <div
          style={{
            color: '#ef4444',
            background: '#1a1a1a',
            padding: '0.75rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          {submitError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="product" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
          Producto
        </label>
        <input
          id="product"
          type="text"
          value={product.name}
          disabled
          style={{
            background: '#0a0a0a',
            border: '1px solid #262626',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#888',
            fontSize: '1rem',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="quantity" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
          Cantidad (Stock: {product.stock})
        </label>
        <input
          id="quantity"
          type="number"
          min="1"
          max={product.stock}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          required
          style={{
            background: '#0a0a0a',
            border: errors.quantity ? '1px solid #ef4444' : '1px solid #262626',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f5f5f5',
            fontSize: '1rem',
          }}
        />
        {errors.quantity && (
          <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.quantity}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="name" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
          Nombre
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            background: '#0a0a0a',
            border: errors.name ? '1px solid #ef4444' : '1px solid #262626',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f5f5f5',
            fontSize: '1rem',
          }}
        />
        {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.name}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="email" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            background: '#0a0a0a',
            border: errors.email ? '1px solid #ef4444' : '1px solid #262626',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f5f5f5',
            fontSize: '1rem',
          }}
        />
        {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.email}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="phone" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
          Teléfono
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{
            background: '#0a0a0a',
            border: errors.phone ? '1px solid #ef4444' : '1px solid #262626',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f5f5f5',
            fontSize: '1rem',
          }}
        />
        {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.phone}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="notes" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{
            background: '#0a0a0a',
            border: '1px solid #262626',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f5f5f5',
            fontSize: '1rem',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!isFormValid}
        style={{
          background: isFormValid ? '#d4af37' : '#4a4a4a',
          color: isFormValid ? '#0a0a0a' : '#888',
          border: 'none',
          borderRadius: '4px',
          padding: '0.75rem',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: isFormValid ? 'pointer' : 'not-allowed',
          marginTop: '0.5rem',
        }}
      >
        Enviar
      </button>
    </form>
  )
}