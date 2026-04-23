import { test as base, Page } from '@playwright/test'

// Custom fixtures for CFS app
interface AuthFixtures {
  adminAuth: { email: string; password: string }
  staffAuth: { email: string; password: string }
  testProduct: { name: string; stock: number }
}

export const test = base.extend<AuthFixtures>({
  adminAuth: { email: 'admin@senacom.com', password: 'changeme123' },
  staffAuth: { email: 'staff@senacom.com', password: 'changeme123' },
  testProduct: { name: 'Producto Test', stock: 10 }
})

export { expect } from '@playwright/test'

// Helper to login and set cookie - uses native input setter for React compatibility
export async function loginAs(page: Page, email: string, password: string, maxRetries = 3) {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await page.goto('/login')
    await page.waitForSelector('input[id="email"]', { state: 'visible' })
    
    // Use native input setter to properly trigger React's onChange
    await page.evaluate(
      ({ email: emailVal, password: passVal }) => {
        const emailInput = document.querySelector('input[id="email"]') as HTMLInputElement
        const passwordInput = document.querySelector('input[id="password"]') as HTMLInputElement
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
        
        nativeSetter.call(emailInput, emailVal)
        emailInput.dispatchEvent(new Event('input', { bubbles: true }))
        
        nativeSetter.call(passwordInput, passVal)
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
      },
      { email, password }
    )
    
    await page.waitForTimeout(100)
    await page.click('button[type="submit"]')
    
    try {
      await page.waitForURL('**/admin**', { timeout: 10000 })
      return
    } catch {
      const currentUrl = page.url()
      if (currentUrl.includes('/login')) {
        lastError = new Error(`Login attempt ${attempt} failed`)
        continue
      }
      throw lastError
    }
  }
  
  throw lastError || new Error('Login failed after max retries')
}
