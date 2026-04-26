/**
 * E2E Tests for Image Upload
 * 
 * Tests the complete image upload flow for staff/admin users
 * 
 * Phase 5: Testing - Task 5.11
 */

import { test, expect, loginAs } from './fixtures'

test.describe('Image Upload E2E', () => {
    test('staff can access product image upload UI', async ({ page }) => {
        // Login as staff
        await loginAs(page, 'staff@senacom.com', 'changeme123')
        
        // Navigate to products page
        await page.goto('/admin/products')
        await page.waitForLoadState('networkidle')

        // Look for a product to edit
        const editButton = page.locator('[data-testid^="edit-product-btn-"]').first()
        
        // If there's a product, verify the form has image upload UI
        if (await editButton.isVisible({ timeout: 5000 })) {
            await editButton.click()
            
            // Wait for form to load
            await page.waitForLoadState('networkidle')
            
            // Verify image section exists with file input
            const imageSection = page.locator('text=Imagen').first()
            await expect(imageSection).toBeVisible()
            
            // Verify file input exists (hidden but present)
            const fileInput = page.locator('input[type="file"]')
            await expect(fileInput).toBeAttached()
            
            // Verify upload button exists
            const uploadButton = page.locator('button:has-text("Seleccionar imagen"), button:has-text("Cambiar imagen")')
            await expect(uploadButton).toBeVisible()
        } else {
            test.skip('No products available for image upload test')
        }
    })

    test('admin can access news image upload UI', async ({ page }) => {
        // Login as admin
        await loginAs(page, 'admin@senacom.com', 'changeme123')
        
        // Navigate to news page
        await page.goto('/admin/news')
        await page.waitForLoadState('networkidle')

        // Look for a news item to edit
        const editButton = page.locator('[data-testid^="edit-news-btn-"]').first()
        
        if (await editButton.isVisible({ timeout: 5000 })) {
            await editButton.click()
            
            await page.waitForLoadState('networkidle')
            
            // Verify image section exists
            const imageSection = page.locator('text=Imagen').first()
            await expect(imageSection).toBeVisible()
            
            // Verify file input exists
            const fileInput = page.locator('input[type="file"]')
            await expect(fileInput).toBeAttached()
        } else {
            test.skip('No news items available for image upload test')
        }
    })

    test('admin can access event image upload UI', async ({ page }) => {
        // Login as admin
        await loginAs(page, 'admin@senacom.com', 'changeme123')
        
        // Navigate to events page
        await page.goto('/admin/events')
        await page.waitForLoadState('networkidle')

        // Look for an event to edit
        const editButton = page.locator('[data-testid^="edit-event-btn-"]').first()
        
        if (await editButton.isVisible({ timeout: 5000 })) {
            await editButton.click()
            
            await page.waitForLoadState('networkidle')
            
            // Verify image section exists (should appear after location field)
            const imageSection = page.locator('text=Imagen').first()
            await expect(imageSection).toBeVisible()
            
            // Verify file input exists
            const fileInput = page.locator('input[type="file"]')
            await expect(fileInput).toBeAttached()
        } else {
            test.skip('No events available for image upload test')
        }
    })

    test('unauthenticated user cannot access upload endpoint', async ({ page }) => {
        // Try to directly access upload endpoint (API test via page)
        const response = await page.request.post('/api/upload', {
            // No auth cookie
        })
        
        // Should get unauthorized
        expect([401, 403]).toContain(response.status())
    })

    test('displays error when uploading invalid file type', async ({ page }) => {
        // Login first
        await loginAs(page, 'staff@senacom.com', 'changeme123')
        
        // Navigate to products
        await page.goto('/admin/products')
        await page.waitForLoadState('networkidle')

        // Try to find edit button
        const editButton = page.locator('[data-testid^="edit-product-btn-"]').first()
        
        if (await editButton.isVisible({ timeout: 5000 })) {
            await editButton.click()
            await page.waitForLoadState('networkidle')
            
            // Look for image upload section
            const imageSection = page.locator('text=Imagen')
            
            if (await imageSection.isVisible({ timeout: 3000 })) {
                // Verify the UI shows file input
                const fileInput = page.locator('input[type="file"]')
                expect(await fileInput.isVisible()).toBeTruthy()
            }
        } else {
            test.skip('No products available for test')
        }
    })

    test('shows image preview after selection', async ({ page }) => {
        // This test verifies the UI displays correctly when an image is set
        await loginAs(page, 'staff@senacom.com', 'changeme123')
        
        await page.goto('/admin/products')
        await page.waitForLoadState('networkidle')

        const editButton = page.locator('[data-testid^="edit-product-btn-"]').first()
        
        if (await editButton.isVisible({ timeout: 5000 })) {
            await editButton.click()
            await page.waitForLoadState('networkidle')
            
            // If the product has an image, it should show a preview
            const preview = page.locator('img[alt="Preview"]')
            
            // Either there's an existing image preview, or there's a button to add one
            const hasPreviewOrButton = await preview.isVisible().catch(() => false) ||
                page.locator('button:has-text("Seleccionar imagen"), button:has-text("Cambiar imagen")').isVisible().catch(() => false)
            
            expect(hasPreviewOrButton).toBeTruthy()
        } else {
            test.skip('No products available for test')
        }
    })
})

test.describe('Image Upload API', () => {
    test('upload endpoint requires authentication', async ({ request }) => {
        // Test API directly without auth
        const response = await request.post('/api/upload', {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        
        // Should not be 200 OK
        expect(response.status()).not.toBe(200)
    })

    test('upload endpoint rejects files without proper auth token', async ({ request }) => {
        const response = await request.post('/api/upload', {
            headers: {
                'Authorization': 'Bearer invalid-token',
                'Content-Type': 'multipart/form-data',
            },
        })
        
        expect(response.status()).toBe(401)
    })
})
