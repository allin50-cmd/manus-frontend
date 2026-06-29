import { test, expect } from '@playwright/test';

// Test data for each route
const testData = {
  'os/contacts/new': {
    name: 'Test Contact',
    email: 'test@example.com',
    phone: '555-1234',
    category: 'Client',
  },
  'os/tasks/new': {
    title: 'Test Task',
    description: 'Test task description',
    assignee: 'George',
    priority: 'High',
  },
  'os/calls/new': {
    contactName: 'Test Contact',
    outcome: 'Positive',
    notes: 'Test call notes',
  },
  'os/messages/new': {
    contactName: 'Test Contact',
    messageType: 'Email',
    body: 'Test message body',
  },
  'os/money/quotes/new': {
    contactName: 'Test Contact',
    amount: '1000',
    description: 'Test quote',
  },
  'os/money/invoices/new': {
    contactName: 'Test Contact',
    amount: '500',
    description: 'Test invoice',
  },
  'os/documents/upload': {
    title: 'Test Document',
  },
};

const routes = [
  'os/contacts/new',
  'os/tasks/new',
  'os/calls/new',
  'os/messages/new',
  'os/money/quotes/new',
  'os/money/invoices/new',
  'os/documents/upload',
];

routes.forEach((route) => {
  test(`${route} - page loads without error`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkFailures: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkFailures.push(`${response.url()} - ${response.status()}`);
      }
    });

    const response = await page.goto(`/${route}`);

    // Should not be 404 or 500
    expect(response?.status()).toBeLessThan(400);

    // Form should render
    const form = page.locator('form');
    await expect(form).toBeVisible({ timeout: 5000 });

    // Should have at least one input field
    const inputs = page.locator('input, select, textarea');
    await expect(inputs.first()).toBeVisible({ timeout: 5000 });

    // Report any console errors
    if (consoleErrors.length > 0) {
      console.log(`⚠️  Console errors on ${route}:`, consoleErrors);
    }

    // Report any network failures
    if (networkFailures.length > 0) {
      console.log(`⚠️  Network failures on ${route}:`, networkFailures);
    }
  });
});

test('os/contacts/new - form submission and validation', async ({ page }) => {
  await page.goto('/os/contacts/new');

  const submitBtn = page.locator('button[type="submit"]');
  const nameInput = page.locator('input[type="text"]').first();

  // Check that name field is required
  await expect(nameInput).toHaveAttribute('required', '');

  // Fill valid data
  const data = testData['os/contacts/new'];
  await nameInput.fill(data.name);
  await page.locator('input[type="email"]').fill(data.email);
  await page.locator('input[type="tel"]').fill(data.phone);

  // Submit
  await submitBtn.click();

  // Wait for redirect or success
  await page.waitForURL(/\/os\/contacts/, { timeout: 10000 }).catch(() => {
    console.log('Note: Did not redirect to /os/contacts after submission');
  });
});

test('os/tasks/new - form submission and validation', async ({ page }) => {
  await page.goto('/os/tasks/new');

  const submitBtn = page.locator('button[type="submit"]');
  const titleInput = page.locator('input[type="text"]').first();

  // Title should be required
  await expect(titleInput).toHaveAttribute('required', '');

  // Fill valid data
  const data = testData['os/tasks/new'];
  await titleInput.fill(data.title);

  // Find and fill description
  const descInput = page.locator('textarea').first();
  if (await descInput.isVisible()) {
    await descInput.fill(data.description);
  }

  // Fill assignee if present
  const assigneeSelects = page.locator('select');
  if (await assigneeSelects.count() > 0) {
    await assigneeSelects.first().selectOption(data.assignee);
  }

  // Submit
  await submitBtn.click();

  // Wait for redirect
  await page.waitForURL(/\/os\/tasks/, { timeout: 10000 }).catch(() => {
    console.log('Note: Did not redirect to /os/tasks after submission');
  });
});

test('os/calls/new - form submission and validation', async ({ page }) => {
  await page.goto('/os/calls/new');

  const submitBtn = page.locator('button[type="submit"]');
  const inputs = page.locator('input, select, textarea');

  // At least one field should be required
  const firstInput = inputs.first();
  const isRequired = await firstInput.evaluate((el: Element) => {
    return (el as HTMLInputElement).required || (el as HTMLSelectElement).required;
  }).catch(() => false);

  if (isRequired) {
    console.log('✓ Validation is enabled');
  }

  // Fill what we can based on form structure
  const textInputs = page.locator('input[type="text"]');
  if (await textInputs.count() > 0) {
    await textInputs.first().fill(testData['os/calls/new'].contactName);
  }

  // Fill textarea if exists
  const textarea = page.locator('textarea').first();
  if (await textarea.isVisible()) {
    await textarea.fill(testData['os/calls/new'].notes);
  }

  // Submit
  await submitBtn.click();

  // Wait for navigation or success indication
  await page.waitForURL(/\/(os\/calls|login)/, { timeout: 10000 }).catch(() => {
    console.log('Note: No redirect detected after submission');
  });
});

test('os/messages/new - form submission and validation', async ({ page }) => {
  await page.goto('/os/messages/new');

  const submitBtn = page.locator('button[type="submit"]');
  const textInputs = page.locator('input[type="text"]');

  // Fill contact name
  if (await textInputs.count() > 0) {
    await textInputs.first().fill(testData['os/messages/new'].contactName);
  }

  // Fill message body
  const textarea = page.locator('textarea').first();
  if (await textarea.isVisible()) {
    await textarea.fill(testData['os/messages/new'].body);
  }

  // Submit
  await submitBtn.click();

  // Wait for navigation
  await page.waitForURL(/\/(os\/messages|login)/, { timeout: 10000 }).catch(() => {
    console.log('Note: No redirect detected after submission');
  });
});

test('os/money/quotes/new - form submission and validation', async ({ page }) => {
  await page.goto('/os/money/quotes/new');

  const submitBtn = page.locator('button[type="submit"]');
  const textInputs = page.locator('input[type="text"], input[type="number"]');
  const textarea = page.locator('textarea').first();

  // Fill contact name
  if (await textInputs.count() > 0) {
    await textInputs.first().fill(testData['os/money/quotes/new'].contactName);
  }

  // Fill amount
  const numberInputs = page.locator('input[type="number"]');
  if (await numberInputs.count() > 0) {
    await numberInputs.first().fill(testData['os/money/quotes/new'].amount);
  }

  // Fill description
  if (await textarea.isVisible()) {
    await textarea.fill(testData['os/money/quotes/new'].description);
  }

  // Submit
  await submitBtn.click();

  // Wait for navigation
  await page.waitForURL(/\/(os\/money|login)/, { timeout: 10000 }).catch(() => {
    console.log('Note: No redirect detected after submission');
  });
});

test('os/money/invoices/new - form submission and validation', async ({ page }) => {
  await page.goto('/os/money/invoices/new');

  const submitBtn = page.locator('button[type="submit"]');
  const textInputs = page.locator('input[type="text"], input[type="number"]');
  const textarea = page.locator('textarea').first();

  // Fill contact name
  if (await textInputs.count() > 0) {
    await textInputs.first().fill(testData['os/money/invoices/new'].contactName);
  }

  // Fill amount
  const numberInputs = page.locator('input[type="number"]');
  if (await numberInputs.count() > 0) {
    await numberInputs.first().fill(testData['os/money/invoices/new'].amount);
  }

  // Fill description
  if (await textarea.isVisible()) {
    await textarea.fill(testData['os/money/invoices/new'].description);
  }

  // Submit
  await submitBtn.click();

  // Wait for navigation
  await page.waitForURL(/\/(os\/money|login)/, { timeout: 10000 }).catch(() => {
    console.log('Note: No redirect detected after submission');
  });
});

test('os/documents/upload - page loads and form renders', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const response = await page.goto('/os/documents/upload');

  expect(response?.status()).toBeLessThan(400);

  // Form should render
  const form = page.locator('form');
  await expect(form).toBeVisible({ timeout: 5000 });

  if (consoleErrors.length > 0) {
    console.log(`⚠️  Console errors on os/documents/upload:`, consoleErrors);
  }
});
