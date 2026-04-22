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

// Helper to login and set cookie
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"], input[id="email"]', email)
  await page.fill('input[name="password"], input[id="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin')
}
