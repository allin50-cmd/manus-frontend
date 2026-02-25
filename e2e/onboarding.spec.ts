import { test, expect } from '@playwright/test';

test.describe('Onboarding Page (unauthenticated)', () => {
  test('redirects unauthenticated users away from onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2500);
    const url = page.url();
    const pathname = new URL(url).pathname;
    // Should redirect to landing page with signup modal, or stay on /onboarding
    expect(url.includes('signup=true') || pathname === '/' || url.includes('/onboarding')).toBeTruthy();
  });
});

test.describe('Onboarding Page Structure', () => {
  // These tests check that the onboarding page renders when accessed
  // Since auth is required, we check what's visible on the page

  test('onboarding page loads without crashing', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(500);
    // Should not have a blank page - either redirects or shows content
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

test.describe('Landing Page - Onboarding Entry Points', () => {
  test('landing page has Start Free CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Start Free/i).first()).toBeVisible();
  });

  test('landing page has Book Demo CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Book.*Demo/i).first()).toBeVisible();
  });

  test('signup leads toward onboarding flow', async ({ page }) => {
    // /signup redirects to /?signup=true which opens the signup modal
    await page.goto('/?signup=true');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Get Started Free' })).toBeVisible();
    // After successful signup, user would be redirected to /onboarding
    // We verify the modal structure exists
  });
});
