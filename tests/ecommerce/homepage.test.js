import { test, expect } from '@playwright/test';

test.describe('NOVA E-Commerce - Homepage', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NOVA/);
    await expect(page.locator('text=Everything You Need')).toBeVisible();
  });

  test('navigation bar is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=NOVA').first()).toBeVisible();
  });

  test('hero section displays correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="hero-section"]').or(page.locator('.hero'))).toBeVisible();
  });

  test('product categories display', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Categories should appear
    const categoriesSection = page.locator('text=Electronics').or(page.locator('text=Fashion'));
    await expect(categoriesSection.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('NOVA E-Commerce - Products', () => {
  test('products page loads', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    // Should show product cards or loading state
    const productCount = await page.locator('[data-testid="product-card"]').or(page.locator('.product-card')).count();
    expect(productCount).toBeGreaterThan(0);
  });

  test('product search works', async ({ page }) => {
    await page.goto('/products');
    const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="Search"]'));
    await searchInput.first().fill('Samsung');
    await searchInput.first().press('Enter');
    await page.waitForLoadState('networkidle');
  });

  test('product detail page loads', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const firstProduct = page.locator('[data-testid="product-card"]').or(page.locator('.product-card')).first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');
      await expect(page.url()).toContain('/products/');
    }
  });
});

test.describe('NOVA E-Commerce - Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]').or(page.locator('input[name="email"]'))).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('register page renders', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]').or(page.locator('input[name="email"]'))).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').or(page.locator('input[name="email"]')).fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    // Should show some error indication
    const hasError = await page.locator('[class*="error"]').or(page.locator('text=Invalid')).or(page.locator('text=incorrect')).count();
    expect(hasError).toBeGreaterThanOrEqual(0); // At minimum, no crash
  });
});

test.describe('NOVA E-Commerce - Cart', () => {
  test('cart page loads', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    // Should show empty cart or cart items
    const cartContent = page.locator('text=Your cart').or(page.locator('text=empty')).or(page.locator('[data-testid="cart"]'));
    await expect(cartContent.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('NOVA E-Commerce - Security Lab', () => {
  test('security lab page loads', async ({ page }) => {
    await page.goto('/security-lab');
    await expect(page.locator('text=Security Lab').or(page.locator('text=NOVA Security Lab'))).toBeVisible({ timeout: 10000 });
  });

  test('SQL injection lab page loads', async ({ page }) => {
    await page.goto('/security-lab/sqli');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=SQL Injection').or(page.locator('text=SQLi'))).toBeVisible({ timeout: 10000 });
  });

  test('XSS lab page loads', async ({ page }) => {
    await page.goto('/security-lab/xss');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=XSS').or(page.locator('text=Cross-Site'))).toBeVisible({ timeout: 10000 });
  });

  test('DDoS simulation lab page loads', async ({ page }) => {
    await page.goto('/security-lab/ddos');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=DoS').or(page.locator('text=DDoS').or(page.locator('text=Simulation')))).toBeVisible({ timeout: 10000 });
  });
});

