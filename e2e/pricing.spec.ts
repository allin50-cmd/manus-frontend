import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('renders hero section', async ({ page }) => {
    await expect(page.getByText('Simple, Transparent Pricing')).toBeVisible();
    await expect(page.getByText('Pay Only for')).toBeVisible();
    await expect(page.getByText('What You Monitor')).toBeVisible();
  });

  test('renders per-service pricing description', async ({ page }) => {
    await expect(page.getByText('£1 per month per company')).toBeVisible();
  });

  test('renders four service cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Companies House', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Corporate Tax', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Self Assessment', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'VAT Returns', exact: true })).toBeVisible();
  });

  test('each service shows £1 price', async ({ page }) => {
    // Service cards each show £1; FAQ text also mentions £1 so count > 4
    const prices = page.getByText('£1');
    await expect(prices.first()).toBeVisible();
    const count = await prices.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('each service shows unit pricing', async ({ page }) => {
    const units = page.getByText('/month per company');
    await expect(units.first()).toBeVisible();
    const count = await units.count();
    expect(count).toBe(4);
  });

  test('service cards show features', async ({ page }) => {
    // Companies House features
    await expect(page.getByText('Annual return deadlines')).toBeVisible();
    await expect(page.getByText('Accounts filing dates')).toBeVisible();
    await expect(page.getByText('Director changes').first()).toBeVisible();
    // Corporate Tax features
    await expect(page.getByText('Corporation tax returns')).toBeVisible();
    // VAT Returns features
    await expect(page.getByText('MTD compliance').first()).toBeVisible();
  });

  test('service CTAs link to signup', async ({ page }) => {
    const addServiceLinks = page.getByRole('link', { name: /Add Service/ });
    await expect(addServiceLinks.first()).toBeVisible();
    const count = await addServiceLinks.count();
    expect(count).toBe(4);
    await expect(addServiceLinks.first()).toHaveAttribute('href', '/signup');
  });

  test('renders How It Works section', async ({ page }) => {
    await expect(page.getByText('How It Works')).toBeVisible();
    await expect(page.getByText('Add your companies')).toBeVisible();
    await expect(page.getByText('Pick your services')).toBeVisible();
    await expect(page.getByText('Stay compliant')).toBeVisible();
  });

  test('renders FAQ section with questions', async ({ page }) => {
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();
    await expect(page.getByText('How does per-company pricing work?')).toBeVisible();
    await expect(page.getByText('Can I add or remove services at any time?')).toBeVisible();
    await expect(page.getByText('Is there a minimum commitment?')).toBeVisible();
    await expect(page.getByText('Do you offer discounts for charities?')).toBeVisible();
    await expect(page.getByText('How does Companies House monitoring work?')).toBeVisible();
    await expect(page.getByText('Is my data secure?')).toBeVisible();
  });

  test('FAQ answers are visible', async ({ page }) => {
    // FAQs are always expanded (no accordion toggle)
    await expect(page.getByText('Each service costs £1 per month for each company you monitor')).toBeVisible();
  });

  test('renders bottom CTA section', async ({ page }) => {
    await expect(page.getByText('Still have questions?')).toBeVisible();
    await expect(page.getByRole('link', { name: /Book a Demo/ }).first()).toBeVisible();
  });
});
