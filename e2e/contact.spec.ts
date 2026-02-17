import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('renders hero section', async ({ page }) => {
    await expect(page.getByText('Get in Touch')).toBeVisible();
    await expect(page.getByText("We'd love to")).toBeVisible();
    await expect(page.getByText('hear from you')).toBeVisible();
  });

  test('renders contact form with all fields', async ({ page }) => {
    await expect(page.getByText('Send us a message')).toBeVisible();
    await expect(page.getByPlaceholder('John Smith')).toBeVisible();
    await expect(page.getByPlaceholder('john@company.co.uk')).toBeVisible();
    await expect(page.getByPlaceholder('Acme Ltd')).toBeVisible();
    await expect(page.getByPlaceholder('Compliance enquiry')).toBeVisible();
    await expect(page.getByPlaceholder('Tell us how we can help...')).toBeVisible();
  });

  test('renders form labels', async ({ page }) => {
    await expect(page.getByText('Full Name').first()).toBeVisible();
    await expect(page.getByText('Email').first()).toBeVisible();
    await expect(page.getByText('Company').first()).toBeVisible();
    await expect(page.getByText('Subject').first()).toBeVisible();
    await expect(page.getByText('Message').first()).toBeVisible();
  });

  test('renders Send Message button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
  });

  test('renders office locations', async ({ page }) => {
    await expect(page.getByText('London Office')).toBeVisible();
    await expect(page.getByText('71-75 Shelton Street')).toBeVisible();
    await expect(page.getByText('+44 20 7946 0958')).toBeVisible();

    await expect(page.getByText('Manchester Office')).toBeVisible();
    await expect(page.getByText('123 Deansgate')).toBeVisible();
    await expect(page.getByText('+44 161 456 7890')).toBeVisible();
  });

  test('renders quick contact info', async ({ page }) => {
    await expect(page.getByText('Quick Contact')).toBeVisible();
    await expect(page.getByText('hello@fineguard.co.uk')).toBeVisible();
    await expect(page.getByText('Mon-Fri 9am-6pm GMT')).toBeVisible();
  });

  test('renders response time badge', async ({ page }) => {
    await expect(page.getByText('Average response time')).toBeVisible();
    await expect(page.getByText('< 4 hours')).toBeVisible();
    await expect(page.getByText('During business hours')).toBeVisible();
  });

  test('form fields are fillable', async ({ page }) => {
    await page.getByPlaceholder('John Smith').fill('Jane Doe');
    await page.getByPlaceholder('john@company.co.uk').fill('jane@test.co.uk');
    await page.getByPlaceholder('Acme Ltd').fill('TestCo');
    await page.getByPlaceholder('Compliance enquiry').fill('General enquiry');
    await page.getByPlaceholder('Tell us how we can help...').fill('I have a question about pricing.');

    await expect(page.getByPlaceholder('John Smith')).toHaveValue('Jane Doe');
    await expect(page.getByPlaceholder('john@company.co.uk')).toHaveValue('jane@test.co.uk');
    await expect(page.getByPlaceholder('Acme Ltd')).toHaveValue('TestCo');
    await expect(page.getByPlaceholder('Compliance enquiry')).toHaveValue('General enquiry');
    await expect(page.getByPlaceholder('Tell us how we can help...')).toHaveValue('I have a question about pricing.');
  });

  test('email field has email type validation', async ({ page }) => {
    const emailInput = page.getByPlaceholder('john@company.co.uk');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });
});
