import { describe, it, expect } from 'vitest'
import {
  validateHoneypot,
  validateTiming,
  checkRateLimit,
  generateVerificationCode,
  isVerificationCodeExpired,
  isMaxAttemptsExceeded
} from '../../middleware/antiFraud.js'

describe('Anti-Fraud Middleware', () => {
  describe('validateHoneypot', () => {
    it('accepts when honeypot field is empty/undefined', () => {
      expect(validateHoneypot(undefined).valid).toBe(true)
      expect(validateHoneypot(null).valid).toBe(true)
      expect(validateHoneypot('').valid).toBe(true)
    })

    it('rejects when honeypot field has content', () => {
      const result = validateHoneypot('http://spam-site.com')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Por favor, completa el formulario correctamente')
    })

    it('accepts empty string or whitespace only', () => {
      // Empty string - no bot would intentionally fill this
      expect(validateHoneypot('').valid).toBe(true)
      // Whitespace - some bots might leave this as default
      expect(validateHoneypot('   ').valid).toBe(true)
    })
  })

  describe('validateTiming', () => {
    it('accepts when formRenderTime is undefined', () => {
      const result = validateTiming(undefined)
      expect(result.valid).toBe(true)
    })

    it('accepts when elapsed time >= 3 seconds', () => {
      const formRenderTime = Date.now() - 4000
      const result = validateTiming(formRenderTime)
      expect(result.valid).toBe(true)
    })

    it('rejects when elapsed time < 3 seconds', () => {
      const formRenderTime = Date.now() - 2000
      const result = validateTiming(formRenderTime)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Por favor, revisa el formulario antes de enviar')
    })

    it('rejects instant submission (0ms)', () => {
      const formRenderTime = Date.now()
      const result = validateTiming(formRenderTime)
      expect(result.valid).toBe(false)
    })
  })

  describe('checkRateLimit', () => {
    it('accepts when reservation count is 0', () => {
      const result = checkRateLimit(0)
      expect(result.valid).toBe(true)
    })

    it('accepts when reservation count is 2', () => {
      const result = checkRateLimit(2)
      expect(result.valid).toBe(true)
    })

    it('rejects when reservation count >= 3', () => {
      const result = checkRateLimit(3)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Algo salió mal, por favor intenta más tarde')
    })

    it('rejects when reservation count exceeds 3', () => {
      const result = checkRateLimit(5)
      expect(result.valid).toBe(false)
    })
  })

  describe('generateVerificationCode', () => {
    it('generates 4-digit code', () => {
      const code = generateVerificationCode()
      expect(code).toMatch(/^\d{4}$/)
    })

    it('generates codes in valid range (1000-9999)', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateVerificationCode()
        const num = parseInt(code, 10)
        expect(num).toBeGreaterThanOrEqual(1000)
        expect(num).toBeLessThanOrEqual(9999)
      }
    })
  })

  describe('isVerificationCodeExpired', () => {
    it('returns false for future date', () => {
      const futureDate = new Date(Date.now() + 600000) // 10 min from now
      expect(isVerificationCodeExpired(futureDate)).toBe(false)
    })

    it('returns true for past date', () => {
      const pastDate = new Date(Date.now() - 60000) // 1 min ago
      expect(isVerificationCodeExpired(pastDate)).toBe(true)
    })

    it('handles ISO string dates', () => {
      const pastDate = new Date(Date.now() - 60000).toISOString()
      expect(isVerificationCodeExpired(pastDate)).toBe(true)
    })
  })

  describe('isMaxAttemptsExceeded', () => {
    it('returns false for 0 attempts', () => {
      expect(isMaxAttemptsExceeded(0)).toBe(false)
    })

    it('returns false for 2 attempts', () => {
      expect(isMaxAttemptsExceeded(2)).toBe(false)
    })

    it('returns true for 3 attempts', () => {
      expect(isMaxAttemptsExceeded(3)).toBe(true)
    })

    it('returns true for more than 3 attempts', () => {
      expect(isMaxAttemptsExceeded(5)).toBe(true)
    })
  })
})
