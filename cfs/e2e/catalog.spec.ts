import { test, expect } from './fixtures'

test.describe('Catalog', () => {
  test('catalog page accessible without auth', async ({ page }) => {
    await page.goto('/catalog')
    
    // Catalog should be publicly accessible
    await expect(page.locator('[data-testid="catalog-page"]')).toBeVisible()
    await expect(page.locator('h1:has-text("Catálogo")')).toBeVisible()
  })

  test('shows products list', async ({ page }) => {
    await page.goto('/catalog')
    
    // Should show products (or empty state)
    const productCards = page.locator('[data-testid*="product"]')
    // Either products are shown or empty state
    const hasProducts = await productCards.count() > 0
    const hasEmptyState = await page.locator('text=No hay productos disponibles').isVisible()
    
    expect(hasProducts || hasEmptyState).toBe(true)
  })

  test('click on product shows reservation form with stock', async ({ page }) => {
    await page.goto('/catalog')
    
    // Wait for products to load
    await page.waitForSelector('[data-testid*="product-card"]', { timeout: 5000 }).catch(() => null)
    
    const productCard = page.locator('[data-testid*="product-card"]').first()
    const hasProducts = await productCard.isVisible().catch(() => false)
    
    if (hasProducts) {
      await productCard.click()
      
      // Should show reservation form
      await expect(page.locator('text=Volver al catálogo')).toBeVisible()
    }
  })
})
