import { test, expect } from '@playwright/test';

test.describe('Landing Page (FineGuard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero headline', async ({ page }) => {
    await expect(page.getByText(/Never Miss a/).first()).toBeVisible();
    await expect(page.getByText('Compliance Deadline')).toBeVisible();
  });

  test('renders hero subtitle', async ({ page }) => {
    await expect(page.getByText('FineGuard automatically monitors Companies House')).toBeVisible();
  });

  test('renders hero CTAs', async ({ page }) => {
    await expect(page.getByText(/Book.*Demo/i).first()).toBeVisible();
    await expect(page.getByText(/Start Free/i).first()).toBeVisible();
  });

  test('renders compliance problems section', async ({ page }) => {
    await expect(page.getByText("Compliance mistakes happen quietly")).toBeVisible();
    await expect(page.getByText("until it's too late")).toBeVisible();
  });

  test('lists compliance pain points', async ({ page }) => {
    await expect(page.getByText('Missed confirmation statements')).toBeVisible();
    await expect(page.getByText('Filing deadlines slipping')).toBeVisible();
    await expect(page.getByText('Unexpected company strike-offs')).toBeVisible();
  });

  test('renders automated compliance section', async ({ page }) => {
    await expect(page.getByText(/Compliance protection.*automated/i).first()).toBeVisible();
  });

  test('renders feature cards', async ({ page }) => {
    await expect(page.getByText('Automatic Companies House monitoring')).toBeVisible();
    await expect(page.getByText('Deadline and filing alerts')).toBeVisible();
  });

  test('renders dashboard preview / stats section', async ({ page }) => {
    await expect(page.getByText('See risks before they')).toBeVisible();
    await expect(page.getByText('become problems')).toBeVisible();
  });

  test('renders audience section', async ({ page }) => {
    await expect(page.getByText('businesses and advisors')).toBeVisible();
    await expect(page.getByText('Accountants & Advisors')).toBeVisible();
    await expect(page.getByText('Company Formation Agents')).toBeVisible();
    await expect(page.getByText('SMEs & Directors')).toBeVisible();
  });

  test('renders testimonials section', async ({ page }) => {
    await expect(page.getByText(/Trusted by/i).first()).toBeVisible();
    await expect(page.getByText('Sarah M.')).toBeVisible();
    await expect(page.getByText('James P.')).toBeVisible();
    await expect(page.getByText('Rachel K.')).toBeVisible();
  });

  test('renders pricing teaser section', async ({ page }) => {
    await expect(page.getByText(/Simple.*transparent.*pricing/i).first()).toBeVisible();
    await expect(page.getByText('$0').first()).toBeVisible();
    await expect(page.getByText('$49').first()).toBeVisible();
  });

  test('renders bottom CTA', async ({ page }) => {
    await expect(page.getByText('Protect companies before')).toBeVisible();
    await expect(page.getByText('problems start')).toBeVisible();
  });
});
