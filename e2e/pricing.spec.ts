import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('renders hero section', async ({ page }) => {
    await expect(page.getByText('Simple, Transparent Pricing')).toBeVisible();
    await expect(page.getByText('Protect your companies')).toBeVisible();
    await expect(page.getByText('Start free. Upgrade when you need more')).toBeVisible();
  });

  test('renders billing toggle (Monthly/Annual)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Monthly' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Annual/ })).toBeVisible();
  });

  test('renders three pricing cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Professional' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
  });

  test('Starter plan shows Free price', async ({ page }) => {
    await expect(page.getByText('Free').first()).toBeVisible();
  });

  test('Professional plan shows price', async ({ page }) => {
    // Monthly default
    await expect(page.getByText('£49').or(page.getByText('£39'))).toBeVisible();
  });

  test('Enterprise plan shows price', async ({ page }) => {
    await expect(page.getByText('£199').or(page.getByText('£159'))).toBeVisible();
  });

  test('switching to Annual billing updates prices', async ({ page }) => {
    await page.getByRole('button', { name: /Annual/ }).click();
    await expect(page.getByText('£39')).toBeVisible();
    await expect(page.getByText('£159')).toBeVisible();
  });

  test('switching back to Monthly restores prices', async ({ page }) => {
    await page.getByRole('button', { name: /Annual/ }).click();
    await page.getByRole('button', { name: 'Monthly' }).click();
    await expect(page.getByText('£49')).toBeVisible();
    await expect(page.getByText('£199')).toBeVisible();
  });

  test('shows Most Popular badge on Professional card', async ({ page }) => {
    await expect(page.getByText('Most Popular')).toBeVisible();
  });

  test('Starter CTA links to signup', async ({ page }) => {
    const starterCta = page.getByRole('link', { name: /Get Started Free/ });
    await expect(starterCta).toBeVisible();
    await expect(starterCta).toHaveAttribute('href', '/signup');
  });

  test('Professional CTA links to signup', async ({ page }) => {
    const proCta = page.getByRole('link', { name: /Start 14-Day Trial/ });
    await expect(proCta).toBeVisible();
    await expect(proCta).toHaveAttribute('href', '/signup');
  });

  test('Enterprise CTA links to book-demo', async ({ page }) => {
    const entCta = page.getByRole('link', { name: /Contact Sales/ });
    await expect(entCta).toBeVisible();
    await expect(entCta).toHaveAttribute('href', '/book-demo');
  });

  test('renders feature comparison table', async ({ page }) => {
    await expect(page.getByText('Compare All Features')).toBeVisible();
    // Check table columns
    await expect(page.getByText('Feature').first()).toBeVisible();
    // Check some feature rows
    await expect(page.getByText('Companies').first()).toBeVisible();
    await expect(page.getByText('Team Members').first()).toBeVisible();
    await expect(page.getByText('Email Alerts').first()).toBeVisible();
  });

  test('renders FAQ section with questions', async ({ page }) => {
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();
    await expect(page.getByText('Can I switch plans at any time?')).toBeVisible();
    await expect(page.getByText('What happens when my trial ends?')).toBeVisible();
    await expect(page.getByText('Do you offer discounts for charities?')).toBeVisible();
    await expect(page.getByText('How does Companies House monitoring work?')).toBeVisible();
    await expect(page.getByText('Is my data secure?')).toBeVisible();
    await expect(page.getByText('Can I export my compliance data?')).toBeVisible();
  });

  test('FAQ answers are expandable', async ({ page }) => {
    // Click first FAQ question
    await page.getByText('Can I switch plans at any time?').click();
    await expect(page.getByText('Yes. Upgrade instantly or downgrade')).toBeVisible();
  });

  test('renders bottom CTA section', async ({ page }) => {
    await expect(page.getByText('Still have questions?')).toBeVisible();
    await expect(page.getByRole('link', { name: /Book a Demo/ }).first()).toBeVisible();
  });
});
