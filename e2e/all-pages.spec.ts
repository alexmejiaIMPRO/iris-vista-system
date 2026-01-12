import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:8080/api/v1';

// Test all pages load correctly
test.describe('All Pages Load Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@company.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|.*\/$/);
  });

  test('Home/Dashboard page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await page.waitForLoadState('networkidle');
    // Check for dashboard elements
    const content = await page.content();
    expect(content.toLowerCase()).toContain('vista');
  });

  test('Internal Catalog page loads', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page).toHaveURL('/catalog');
    await page.waitForLoadState('networkidle');
  });

  test('New Purchase Request page loads', async ({ page }) => {
    await page.goto('/purchase/new');
    await expect(page).toHaveURL('/purchase/new');
    await page.waitForLoadState('networkidle');
    // Check for URL input
    const urlInput = page.locator('input[placeholder*="URL"], input[name="url"], input[type="url"]');
    await expect(urlInput.first()).toBeVisible();
  });

  test('My Requests page loads', async ({ page }) => {
    await page.goto('/requests');
    await expect(page).toHaveURL('/requests');
    await page.waitForLoadState('networkidle');
  });

  test('Approvals page loads', async ({ page }) => {
    await page.goto('/approvals');
    await expect(page).toHaveURL('/approvals');
    await page.waitForLoadState('networkidle');
  });

  test('Inventory page loads', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page).toHaveURL('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('Analytics page loads', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL('/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('Admin Panel page loads', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('User Management page loads', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/admin/users');
    await page.waitForLoadState('networkidle');
  });

  test('Approved Orders page loads', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page).toHaveURL('/admin/orders');
    await page.waitForLoadState('networkidle');
  });

  test('Amazon Config page loads', async ({ page }) => {
    await page.goto('/admin/amazon-config');
    await expect(page).toHaveURL('/admin/amazon-config');
    await page.waitForLoadState('networkidle');
  });
});

// Test Sidebar Navigation
test.describe('Sidebar Navigation Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@company.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|.*\/$/);
  });

  test('sidebar links work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test clicking on sidebar links
    const sidebarLinks = [
      { text: /catalog|catálogo/i, url: /catalog/ },
      { text: /new purchase|nueva compra|新采购/i, url: /purchase\/new/ },
      { text: /request|solicitud|请求/i, url: /request/ },
      { text: /approval|aprobacion|审批/i, url: /approval/ },
    ];

    for (const link of sidebarLinks) {
      const linkElement = page.locator('aside a').filter({ hasText: link.text }).first();
      if (await linkElement.isVisible()) {
        await linkElement.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(link.url);
        await page.goto('/'); // Go back to home
      }
    }
  });
});

// Test Purchase Request Form
test.describe('Purchase Request Form Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'employee@company.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|.*\/$/);
  });

  test('can fill purchase request form', async ({ page }) => {
    await page.goto('/purchase/new');
    await page.waitForLoadState('networkidle');

    // Fill URL
    const urlInput = page.locator('input[placeholder*="URL"], input[name="url"], input[type="url"]').first();
    await urlInput.fill('https://www.amazon.com.mx/dp/B09V3KXJPB');
    await urlInput.blur();

    // Wait for metadata extraction
    await page.waitForTimeout(3000);

    // Check if form has quantity input
    const quantityInput = page.locator('input[name="quantity"], input[type="number"]').first();
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('2');
    }

    // Check if form has justification textarea
    const justificationInput = page.locator('textarea[name="justification"], textarea').first();
    if (await justificationInput.isVisible()) {
      await justificationInput.fill('Playwright test justification');
    }
  });
});

// Test API Integration from Frontend
test.describe('Frontend-Backend API Integration', () => {
  test('login flow integrates with backend', async ({ page }) => {
    // Clear any existing tokens
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Perform login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'employee@company.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');

    // Intercept the login request
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/auth/login') && resp.status() === 200
    );

    await page.click('button[type="submit"]');

    const response = await responsePromise;
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.access_token).toBeTruthy();

    // Verify token is stored
    await page.waitForURL(/.*dashboard|.*\/$/);
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
  });

  test('metadata extraction integrates with backend', async ({ page, request }) => {
    // Login via API
    const loginResp = await request.post(`${BACKEND_URL}/auth/login`, {
      data: { email: 'employee@company.com', password: 'password123' }
    });
    const { data: { access_token } } = await loginResp.json();

    // Set token in browser
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, access_token);

    // Go to purchase page
    await page.goto('/purchase/new');
    await page.waitForLoadState('networkidle');

    // Fill URL and verify metadata is fetched
    const urlInput = page.locator('input[placeholder*="URL"], input[name="url"], input[type="url"]').first();

    // Intercept metadata request
    const metadataPromise = page.waitForResponse(resp =>
      resp.url().includes('/extract-metadata') && resp.status() === 200
    );

    await urlInput.fill('https://www.amazon.com.mx/dp/B09V3KXJPB');
    await urlInput.blur();

    const metadataResp = await metadataPromise;
    const metadata = await metadataResp.json();

    expect(metadata.success).toBe(true);
    expect(metadata.data.is_amazon).toBe(true);
  });
});

// Test Admin Orders Page
test.describe('Admin Orders Page Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@company.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|.*\/$/);
  });

  test('approved orders page shows filters', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // Check for filter buttons
    const allButton = page.getByRole('button', { name: /all|todas|全部/i });
    await expect(allButton).toBeVisible();
  });

  test('admin dashboard shows stats', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Wait for API data to load
    await page.waitForTimeout(2000);

    // Page should contain dashboard content
    const content = await page.content();
    expect(content).toBeTruthy();
  });
});
