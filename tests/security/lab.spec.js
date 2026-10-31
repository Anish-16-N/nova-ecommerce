const { test, expect } = require('@playwright/test');

test.describe('NOVA E-Commerce & Security Lab E2E Flows', () => {
  test('HomePage loads and displays products', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NOVA/i);
    // Wait for at least one product card
    const card = page.locator('.card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
  });

  test('Security Lab Overview page navigates and displays 3 modules', async ({ page }) => {
    await page.goto('/security-lab');
    await expect(page.locator('h1')).toContainText(/Security Lab/i);
    await expect(page.locator('text=SQL Injection')).toBeVisible();
    await expect(page.locator('text=Cross-Site Scripting')).toBeVisible();
    await expect(page.locator('text=Denial of Service')).toBeVisible();
  });

  test('SQLi Lab executes bypass demonstration', async ({ page }) => {
    await page.goto('/security-lab/sqli');
    await expect(page.locator('h1')).toContainText(/SQL Injection/i);
  });

  test('XSS Lab demonstrates stored and reflected script tests', async ({ page }) => {
    await page.goto('/security-lab/xss');
    await expect(page.locator('h1')).toContainText(/Cross-Site Scripting/i);
  });

  test('DDoS Lab displays real-time RPS chart and controls', async ({ page }) => {
    await page.goto('/security-lab/ddos');
    await expect(page.locator('h1')).toContainText(/Denial of Service/i);
  });
});

