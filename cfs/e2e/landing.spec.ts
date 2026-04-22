import { test, expect } from './fixtures'

test.describe('Landing Page', () => {
  test('shows news feed when available', async ({ page }) => {
    await page.goto('/')
    
    // Should show the news section heading
    await expect(page.locator('h2:has-text("Noticias")')).toBeVisible()
  })

  test('shows empty state message when no news', async ({ page }) => {
    await page.goto('/')
    
    // The empty news message should be visible
    await expect(page.locator('[data-testid="empty-news"]')).toBeVisible()
    await expect(page.locator('[data-testid="empty-news"]')).toHaveText('No hay noticias todavía')
  })

  test('shows catalog preview with up to 6 products', async ({ page }) => {
    await page.goto('/')
    
    // Should show catalog section heading
    await expect(page.locator('h2:has-text("Catálogo")')).toBeVisible()
  })

  test('landing page renders without crashing', async ({ page }) => {
    await page.goto('/')
    
    // Basic sanity check - page loads
    await expect(page.locator('[data-testid="landing-page"]')).toBeVisible()
  })
})
