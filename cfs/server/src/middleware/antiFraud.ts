/**
 * Anti-Fraud Middleware for Checkout Verification
 * 
 * Implements 4-layer anti-fraud:
 * 1. Honeypot validation - rejects if hidden "website" field is filled
 * 2. Timing check - rejects if form submitted <3s from render
 * 3. Rate limiting - max 3 reservations per IP per hour
 * 4. Verification code - 4-digit code with 3 attempts, 10min expiry
 */

// Honeypot field name
const _HONEYPOT_FIELD = 'website'
const HONEYPOT_REJECT_MESSAGE = 'Por favor, completa el formulario correctamente'

// Timing constants
const MIN_FORM_RENDER_TIME_MS = 3000
const TIMING_REJECT_MESSAGE = 'Por favor, revisa el formulario antes de enviar'

// Rate limiting constants
const MAX_RESERVATIONS_PER_IP_PER_HOUR = 3
const _RATE_LIMIT_WINDOW_HOURS = 1
const RATE_LIMIT_REJECT_MESSAGE = 'Algo salió mal, por favor intenta más tarde'

// Verification constants
const VERIFICATION_CODE_ATTEMPTS = 3
const _VERIFICATION_CODE_EXPIRY_MINUTES = 10

export interface HoneypotResult {
  valid: boolean
  message?: string
}

export interface TimingResult {
  valid: boolean
  message?: string
}

export interface RateLimitResult {
  valid: boolean
  message?: string
}

/**
 * Validates honeypot field
 * Bots typically fill ALL input fields including hidden ones
 */
export function validateHoneypot(honeypotValue: string | undefined | null): HoneypotResult {
  // If honeypot field has ANY value (even empty string is falsy), it's suspicious
  // A bot would fill it with something
  if (honeypotValue && honeypotValue.trim().length > 0) {
    return {
      valid: false,
      message: HONEYPOT_REJECT_MESSAGE
    }
  }
  return { valid: true }
}

/**
 * Validates form render time
 * Humans need time to read and fill forms; bots submit instantly
 */
export function validateTiming(formRenderTime: number | undefined | null): TimingResult {
  if (!formRenderTime) {
    // If no timing provided, allow (backwards compatibility)
    return { valid: true }
  }
  
  const now = Date.now()
  const elapsed = now - formRenderTime
  
  if (elapsed < MIN_FORM_RENDER_TIME_MS) {
    return {
      valid: false,
      message: TIMING_REJECT_MESSAGE
    }
  }
  
  return { valid: true }
}

/**
 * Check rate limit for IP address
 * Counts reservations in last hour; rejects if >= 3
 */
export function checkRateLimit(reservationCount: number): RateLimitResult {
  if (reservationCount >= MAX_RESERVATIONS_PER_IP_PER_HOUR) {
    return {
      valid: false,
      message: RATE_LIMIT_REJECT_MESSAGE
    }
  }
  return { valid: true }
}

/**
 * Generate a random 4-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Check if verification code is expired
 */
export function isVerificationCodeExpired(expiresAt: Date | string): boolean {
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return expiryDate.getTime() < Date.now()
}

/**
 * Check if max attempts exceeded
 */
export function isMaxAttemptsExceeded(attempts: number): boolean {
  return attempts >= VERIFICATION_CODE_ATTEMPTS
}
