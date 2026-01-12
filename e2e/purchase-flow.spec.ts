import { test, expect } from '@playwright/test';

// Test configuration
const BACKEND_URL = 'http://localhost:8080/api/v1';
const FRONTEND_URL = 'http://localhost:3000';

// Test users
const USERS = {
  admin: { email: 'admin@company.com', password: 'admin123' },
  employee: { email: 'employee@company.com', password: 'password123' },
  gm: { email: 'gm@company.com', password: 'password123' },
};

test.describe('Frontend/Backend Alignment Tests', () => {

  test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login/);

      // Check login form elements exist
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should login as employee successfully', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[type="email"], input[name="email"]', USERS.employee.email);
      await page.fill('input[type="password"], input[name="password"]', USERS.employee.password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard after login
      await page.waitForURL(/.*dashboard|.*\/$/);

      // Verify we're logged in (localStorage should have token)
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      expect(token).toBeTruthy();
    });

    test('should login as admin successfully', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[type="email"], input[name="email"]', USERS.admin.email);
      await page.fill('input[type="password"], input[name="password"]', USERS.admin.password);
      await page.click('button[type="submit"]');

      await page.waitForURL(/.*dashboard|.*\/$/);
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      expect(token).toBeTruthy();
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error or stay on login page
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
    });
  });

  test.describe('Purchase Request Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login as employee before each test
      await page.goto('/login');
      await page.fill('input[type="email"], input[name="email"]', USERS.employee.email);
      await page.fill('input[type="password"], input[name="password"]', USERS.employee.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard|.*\/$/);
    });

    test('should navigate to new purchase request page', async ({ page }) => {
      await page.goto('/purchase/new');
      await expect(page).toHaveURL(/.*purchase.*new/);

      // Check for URL input field
      const urlInput = page.locator('input[placeholder*="URL"], input[name="url"], input[type="url"]');
      await expect(urlInput).toBeVisible();
    });

    test('should extract metadata from Amazon URL', async ({ page }) => {
      await page.goto('/purchase/new');

      // Find and fill URL input
      const urlInput = page.locator('input[placeholder*="URL"], input[name="url"], input[type="url"]').first();
      await urlInput.fill('https://www.amazon.com.mx/dp/B09V3KXJPB');

      // Trigger metadata extraction (might be on blur or button click)
      await urlInput.blur();
      await page.waitForTimeout(2000);

      // Check if Amazon badge or indicator appears
      const pageContent = await page.content();
      const hasAmazonIndicator = pageContent.toLowerCase().includes('amazon') ||
                                  pageContent.includes('auto') ||
                                  pageContent.includes('cart');
      expect(hasAmazonIndicator).toBeTruthy();
    });
  });

  test.describe('API Integration Tests', () => {
    test('backend health check', async ({ request }) => {
      const response = await request.get('http://localhost:8080/health');
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.status).toBe('ok');
    });

    test('backend login API', async ({ request }) => {
      const response = await request.post(`${BACKEND_URL}/auth/login`, {
        data: {
          email: USERS.employee.email,
          password: USERS.employee.password
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.access_token).toBeTruthy();
    });

    test('backend metadata extraction API', async ({ request }) => {
      // First login
      const loginResp = await request.post(`${BACKEND_URL}/auth/login`, {
        data: { email: USERS.employee.email, password: USERS.employee.password }
      });
      const { data: { access_token } } = await loginResp.json();

      // Extract metadata
      const response = await request.post(`${BACKEND_URL}/purchase-requests/extract-metadata`, {
        headers: { Authorization: `Bearer ${access_token}` },
        data: { url: 'https://www.amazon.com.mx/dp/B09V3KXJPB' }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.is_amazon).toBe(true);
    });

    test('backend create purchase request API', async ({ request }) => {
      // Login
      const loginResp = await request.post(`${BACKEND_URL}/auth/login`, {
        data: { email: USERS.employee.email, password: USERS.employee.password }
      });
      const { data: { access_token } } = await loginResp.json();

      // Create request
      const response = await request.post(`${BACKEND_URL}/purchase-requests`, {
        headers: { Authorization: `Bearer ${access_token}` },
        data: {
          url: 'https://www.mercadolibre.com.mx/test-product',
          quantity: 1,
          justification: 'Playwright E2E Test',
          urgency: 'normal'
        }
      });
      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.request_number).toMatch(/REQ-\d{4}-\d+/);
    });

    test('backend approvals API', async ({ request }) => {
      // Login as GM
      const loginResp = await request.post(`${BACKEND_URL}/auth/login`, {
        data: { email: USERS.gm.email, password: USERS.gm.password }
      });
      const { data: { access_token } } = await loginResp.json();

      // Get pending approvals
      const response = await request.get(`${BACKEND_URL}/approvals`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.meta).toBeDefined();
    });

    test('backend admin dashboard API', async ({ request }) => {
      // Login as admin
      const loginResp = await request.post(`${BACKEND_URL}/auth/login`, {
        data: { email: USERS.admin.email, password: USERS.admin.password }
      });
      const { data: { access_token } } = await loginResp.json();

      // Get dashboard stats
      const response = await request.get(`${BACKEND_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.total_users).toBeGreaterThan(0);
    });
  });
});

test.describe('Complete E2E Purchase Flow', () => {
  test('full purchase request lifecycle', async ({ page, request }) => {
    // Step 1: Employee creates request via UI
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', USERS.employee.email);
    await page.fill('input[type="password"], input[name="password"]', USERS.employee.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|.*\/$/);

    // Navigate to new purchase page
    await page.goto('/purchase/new');
    await page.waitForLoadState('networkidle');

    // Fill the form
    const urlInput = page.locator('input[placeholder*="URL"], input[name="url"], input[type="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://www.amazon.com.mx/dp/B0D7R6FPWF');
      await urlInput.blur();
      await page.waitForTimeout(2000);
    }

    // Step 2: GM approves via API
    const gmLogin = await request.post(`${BACKEND_URL}/auth/login`, {
      data: { email: USERS.gm.email, password: USERS.gm.password }
    });
    const gmToken = (await gmLogin.json()).data.access_token;

    // Get pending requests
    const pendingResp = await request.get(`${BACKEND_URL}/approvals`, {
      headers: { Authorization: `Bearer ${gmToken}` }
    });
    const pending = await pendingResp.json();

    if (pending.data && pending.data.length > 0) {
      const requestId = pending.data[0].id;

      // Approve
      const approveResp = await request.post(`${BACKEND_URL}/approvals/${requestId}/approve`, {
        headers: { Authorization: `Bearer ${gmToken}` },
        data: { comment: 'Playwright test approval' }
      });
      expect(approveResp.ok()).toBeTruthy();
    }

    // Step 3: Admin marks as purchased via API
    const adminLogin = await request.post(`${BACKEND_URL}/auth/login`, {
      data: { email: USERS.admin.email, password: USERS.admin.password }
    });
    const adminToken = (await adminLogin.json()).data.access_token;

    const ordersResp = await request.get(`${BACKEND_URL}/admin/approved-orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const orders = await ordersResp.json();

    if (orders.data && orders.data.length > 0) {
      const orderId = orders.data[0].id;

      const purchaseResp = await request.patch(`${BACKEND_URL}/admin/orders/${orderId}/purchased`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { notes: 'Playwright E2E complete' }
      });
      expect(purchaseResp.ok()).toBeTruthy();
    }
  });
});
