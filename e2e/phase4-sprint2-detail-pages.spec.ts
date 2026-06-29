import { test, expect } from '@playwright/test'

test.describe('Phase 4 Sprint 2 - Detail Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tasks list to ensure we have valid data
    await page.goto('/os/tasks')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Task Detail Page', () => {
    test('loads task detail page', async ({ page }) => {
      // Get first task ID by looking at the page
      const taskLinks = page.locator('a[href*="/os/tasks/"]')
      if (await taskLinks.count() > 0) {
        // Extract ID from first link
        const href = await taskLinks.first().getAttribute('href')
        if (href && href !== '/os/tasks/new') {
          const taskId = href.split('/').pop()

          await page.goto(`/os/tasks/${taskId}`)
          await page.waitForLoadState('networkidle')

          // Verify page loaded
          await expect(page.locator('h1:has-text("Task Details")')).toBeVisible()

          // Verify form elements populated
          const titleInput = page.locator('input[placeholder="Task title"]')
          await expect(titleInput).toHaveValue(/.*/)

          // Verify no console errors
          const consoleErrors: string[] = []
          page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text())
          })

          expect(consoleErrors).toHaveLength(0)
        }
      }
    })

    test('edit and save task', async ({ page }) => {
      const taskLinks = page.locator('a[href*="/os/tasks/"]')
      if (await taskLinks.count() > 0) {
        const href = await taskLinks.first().getAttribute('href')
        if (href && href !== '/os/tasks/new') {
          const taskId = href.split('/').pop()

          await page.goto(`/os/tasks/${taskId}`)
          await page.waitForLoadState('networkidle')

          // Edit task
          const titleInput = page.locator('input[placeholder="Task title"]')
          const originalValue = await titleInput.inputValue()
          const newValue = `Updated ${Date.now()}`

          await titleInput.clear()
          await titleInput.fill(newValue)

          // Save
          await page.locator('button:has-text("Save Changes")').click()
          await page.waitForLoadState('networkidle')

          // Verify save succeeded
          await expect(page.locator('text=Saving')).toBeHidden({ timeout: 5000 })

          // Verify value persisted
          await expect(titleInput).toHaveValue(newValue)
        }
      }
    })

    test('delete task with confirmation', async ({ page }) => {
      const taskLinks = page.locator('a[href*="/os/tasks/"]')
      if (await taskLinks.count() > 1) {
        // Use second task to avoid deleting important data
        const href = await taskLinks.nth(1).getAttribute('href')
        if (href && href !== '/os/tasks/new') {
          const taskId = href.split('/').pop()

          await page.goto(`/os/tasks/${taskId}`)
          await page.waitForLoadState('networkidle')

          page.once('dialog', dialog => {
            expect(dialog.message()).toContain('Are you sure')
            dialog.accept()
          })

          await page.locator('button:has-text("Delete")').click()

          // Should redirect to tasks list
          await page.waitForURL('/os/tasks')
          await expect(page).toHaveURL('/os/tasks')
        }
      }
    })

    test('validation requires title', async ({ page }) => {
      const taskLinks = page.locator('a[href*="/os/tasks/"]')
      if (await taskLinks.count() > 0) {
        const href = await taskLinks.first().getAttribute('href')
        if (href && href !== '/os/tasks/new') {
          const taskId = href.split('/').pop()

          await page.goto(`/os/tasks/${taskId}`)
          await page.waitForLoadState('networkidle')

          // Clear title
          const titleInput = page.locator('input[placeholder="Task title"]')
          await titleInput.clear()

          // Save button should be disabled
          const saveBtn = page.locator('button:has-text("Save Changes")')
          await expect(saveBtn).toBeDisabled()
        }
      }
    })
  })

  test.describe('Contact Detail Page', () => {
    test('loads contact detail page', async ({ page }) => {
      await page.goto('/os/contacts')
      await page.waitForLoadState('networkidle')

      const contactLinks = page.locator('a[href*="/os/contacts/"]')
      if (await contactLinks.count() > 0) {
        const href = await contactLinks.first().getAttribute('href')
        if (href && href !== '/os/contacts/new') {
          const contactId = href.split('/').pop()

          await page.goto(`/os/contacts/${contactId}`)
          await page.waitForLoadState('networkidle')

          await expect(page.locator('h1:has-text("Contact Details")')).toBeVisible()
          await expect(page.locator('input[placeholder="Full name"]')).toHaveValue(/.*/)
        }
      }
    })

    test('edit and save contact', async ({ page }) => {
      await page.goto('/os/contacts')
      await page.waitForLoadState('networkidle')

      const contactLinks = page.locator('a[href*="/os/contacts/"]')
      if (await contactLinks.count() > 0) {
        const href = await contactLinks.first().getAttribute('href')
        if (href && href !== '/os/contacts/new') {
          const contactId = href.split('/').pop()

          await page.goto(`/os/contacts/${contactId}`)
          await page.waitForLoadState('networkidle')

          const nameInput = page.locator('input[placeholder="Full name"]')
          const newValue = `Test ${Date.now()}`

          await nameInput.clear()
          await nameInput.fill(newValue)

          await page.locator('button:has-text("Save Changes")').click()
          await page.waitForLoadState('networkidle')

          await expect(nameInput).toHaveValue(newValue)
        }
      }
    })
  })

  test.describe('Call Detail Page', () => {
    test('loads call detail page', async ({ page }) => {
      await page.goto('/os/calls')
      await page.waitForLoadState('networkidle')

      const callLinks = page.locator('a[href*="/os/calls/"]')
      if (await callLinks.count() > 0) {
        const href = await callLinks.first().getAttribute('href')
        if (href && href !== '/os/calls/new') {
          const callId = href.split('/').pop()

          await page.goto(`/os/calls/${callId}`)
          await page.waitForLoadState('networkidle')

          await expect(page.locator('h1:has-text("Call Details")')).toBeVisible()
          await expect(page.locator('input[placeholder*="person"]')).toBeVisible()
        }
      }
    })

    test('edit and save call', async ({ page }) => {
      await page.goto('/os/calls')
      await page.waitForLoadState('networkidle')

      const callLinks = page.locator('a[href*="/os/calls/"]')
      if (await callLinks.count() > 0) {
        const href = await callLinks.first().getAttribute('href')
        if (href && href !== '/os/calls/new') {
          const callId = href.split('/').pop()

          await page.goto(`/os/calls/${callId}`)
          await page.waitForLoadState('networkidle')

          const nameInput = page.locator('input[placeholder*="person"]')
          const newValue = `Caller ${Date.now()}`

          await nameInput.clear()
          await nameInput.fill(newValue)

          await page.locator('button:has-text("Save Changes")').click()
          await page.waitForLoadState('networkidle')

          await expect(nameInput).toHaveValue(newValue)
        }
      }
    })
  })

  test.describe('Invoice Detail Page', () => {
    test('loads invoice detail page', async ({ page }) => {
      await page.goto('/os/money')
      await page.waitForLoadState('networkidle')

      const invoiceLinks = page.locator('a[href*="/os/money/invoices/"]')
      if (await invoiceLinks.count() > 0) {
        const href = await invoiceLinks.first().getAttribute('href')
        if (href) {
          const invoiceId = href.split('/').pop()

          await page.goto(`/os/money/invoices/${invoiceId}`)
          await page.waitForLoadState('networkidle')

          await expect(page.locator('h1:has-text("Invoice")')).toBeVisible()
        }
      }
    })

    test('mark invoice as paid workflow', async ({ page }) => {
      await page.goto('/os/money')
      await page.waitForLoadState('networkidle')

      const invoiceLinks = page.locator('a[href*="/os/money/invoices/"]')
      if (await invoiceLinks.count() > 0) {
        const href = await invoiceLinks.first().getAttribute('href')
        if (href) {
          const invoiceId = href.split('/').pop()

          await page.goto(`/os/money/invoices/${invoiceId}`)
          await page.waitForLoadState('networkidle')

          const status = await page.locator('p:has-text("Status:")').textContent()

          if (!status?.includes('Paid')) {
            // Click mark as paid
            const markPaidBtn = page.locator('button:has-text("Mark as Paid")')
            if (await markPaidBtn.isVisible()) {
              await markPaidBtn.click()
              await page.waitForLoadState('networkidle')

              // Verify status updated
              const updatedStatus = await page.locator('p:has-text("Status:")').textContent()
              expect(updatedStatus).toContain('Paid')

              // Verify button gone
              await expect(page.locator('button:has-text("Mark as Paid")')).toBeHidden()

              // Refresh and verify persists
              await page.reload()
              await page.waitForLoadState('networkidle')

              const persistedStatus = await page.locator('p:has-text("Status:")').textContent()
              expect(persistedStatus).toContain('Paid')
            }
          }
        }
      }
    })

    test('edit invoice amount', async ({ page }) => {
      await page.goto('/os/money')
      await page.waitForLoadState('networkidle')

      const invoiceLinks = page.locator('a[href*="/os/money/invoices/"]')
      if (await invoiceLinks.count() > 0) {
        const href = await invoiceLinks.first().getAttribute('href')
        if (href) {
          const invoiceId = href.split('/').pop()

          await page.goto(`/os/money/invoices/${invoiceId}`)
          await page.waitForLoadState('networkidle')

          const amountInput = page.locator('input[placeholder="0.00"]').first()
          const originalValue = await amountInput.inputValue()
          const newValue = '999.99'

          await amountInput.clear()
          await amountInput.fill(newValue)

          await page.locator('button:has-text("Save Changes")').click()
          await page.waitForLoadState('networkidle')

          await expect(amountInput).toHaveValue(newValue)
        }
      }
    })
  })

  test.describe('Quote Detail Page', () => {
    test('loads quote detail page', async ({ page }) => {
      await page.goto('/os/money')
      await page.waitForLoadState('networkidle')

      const quoteLinks = page.locator('a[href*="/os/money/quotes/"]')
      if (await quoteLinks.count() > 0) {
        const href = await quoteLinks.first().getAttribute('href')
        if (href) {
          const quoteId = href.split('/').pop()

          await page.goto(`/os/money/quotes/${quoteId}`)
          await page.waitForLoadState('networkidle')

          await expect(page.locator('h1:has-text("Quote")')).toBeVisible()
        }
      }
    })

    test('accept quote workflow', async ({ page }) => {
      await page.goto('/os/money')
      await page.waitForLoadState('networkidle')

      const quoteLinks = page.locator('a[href*="/os/money/quotes/"]')
      if (await quoteLinks.count() > 0) {
        const href = await quoteLinks.first().getAttribute('href')
        if (href) {
          const quoteId = href.split('/').pop()

          await page.goto(`/os/money/quotes/${quoteId}`)
          await page.waitForLoadState('networkidle')

          const status = await page.locator('p:has-text("Status:")').textContent()

          if (!status?.includes('Accepted') && !status?.includes('Declined')) {
            const acceptBtn = page.locator('button:has-text("Accept")')
            if (await acceptBtn.isVisible()) {
              await acceptBtn.click()
              await page.waitForLoadState('networkidle')

              const updatedStatus = await page.locator('p:has-text("Status:")').textContent()
              expect(updatedStatus).toContain('Accepted')

              // Verify buttons hidden
              await expect(page.locator('button:has-text("Accept")')).toBeHidden()
              await expect(page.locator('button:has-text("Decline")')).toBeHidden()

              // Refresh and verify
              await page.reload()
              await page.waitForLoadState('networkidle')

              const persistedStatus = await page.locator('p:has-text("Status:")').textContent()
              expect(persistedStatus).toContain('Accepted')
            }
          }
        }
      }
    })

    test('decline quote workflow', async ({ page }) => {
      await page.goto('/os/money')
      await page.waitForLoadState('networkidle')

      const quoteLinks = page.locator('a[href*="/os/money/quotes/"]')
      if (await quoteLinks.count() > 1) {
        // Use second quote to avoid interfering with first one
        const href = await quoteLinks.nth(1).getAttribute('href')
        if (href) {
          const quoteId = href.split('/').pop()

          await page.goto(`/os/money/quotes/${quoteId}`)
          await page.waitForLoadState('networkidle')

          const status = await page.locator('p:has-text("Status:")').textContent()

          if (!status?.includes('Accepted') && !status?.includes('Declined')) {
            const declineBtn = page.locator('button:has-text("Decline")')
            if (await declineBtn.isVisible()) {
              await declineBtn.click()
              await page.waitForLoadState('networkidle')

              const updatedStatus = await page.locator('p:has-text("Status:")').textContent()
              expect(updatedStatus).toContain('Declined')

              // Verify buttons hidden
              await expect(page.locator('button:has-text("Accept")')).toBeHidden()
              await expect(page.locator('button:has-text("Decline")')).toBeHidden()

              // Refresh and verify
              await page.reload()
              await page.waitForLoadState('networkidle')

              const persistedStatus = await page.locator('p:has-text("Status:")').textContent()
              expect(persistedStatus).toContain('Declined')
            }
          }
        }
      }
    })

    test('edit quote amount', async ({ page }) => {
      await page.goto('/os/money')
      await page.waitForLoadState('networkidle')

      const quoteLinks = page.locator('a[href*="/os/money/quotes/"]')
      if (await quoteLinks.count() > 0) {
        const href = await quoteLinks.first().getAttribute('href')
        if (href) {
          const quoteId = href.split('/').pop()

          await page.goto(`/os/money/quotes/${quoteId}`)
          await page.waitForLoadState('networkidle')

          const amountInput = page.locator('input[placeholder="0.00"]').first()
          const newValue = '1500.50'

          await amountInput.clear()
          await amountInput.fill(newValue)

          await page.locator('button:has-text("Save Changes")').click()
          await page.waitForLoadState('networkidle')

          await expect(amountInput).toHaveValue(newValue)
        }
      }
    })
  })
})
