import { test, expect } from '@playwright/test'

const PERSON = 'Charlie'
const DEFAULT_PASSCODE = 'demo1234'

test.describe('Settings — change password', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByRole('button', { name: PERSON }).click()
    await page.getByPlaceholder('Enter passcode').fill(DEFAULT_PASSCODE)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/dashboard')
  })

  test('settings page shows signed-in user', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('p', { hasText: /signed in as/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Change password' })).toBeVisible()
  })

  test('rejects short new password (client-side minLength)', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Current password').fill(DEFAULT_PASSCODE)
    await page.getByLabel('New password', { exact: true }).fill('short')
    await page.getByLabel('Confirm new password').fill('short')
    await page.getByRole('button', { name: 'Change password' }).click()
    // browser native minLength validation prevents submission — button stays enabled
    // and no success message appears
    await expect(page.getByText(/password changed/i)).not.toBeVisible()
  })

  test('rejects mismatched confirm password', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Current password').fill(DEFAULT_PASSCODE)
    await page.getByLabel('New password', { exact: true }).fill('newpassword123')
    await page.getByLabel('Confirm new password').fill('different123')
    await page.getByRole('button', { name: 'Change password' }).click()
    await expect(page.getByText(/do not match/i)).toBeVisible()
  })

  test('rejects wrong current password', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Current password').fill('wrongcurrent')
    await page.getByLabel('New password', { exact: true }).fill('newpassword123')
    await page.getByLabel('Confirm new password').fill('newpassword123')
    await page.getByRole('button', { name: 'Change password' }).click()
    await expect(page.getByText(/incorrect/i)).toBeVisible()
  })
})
