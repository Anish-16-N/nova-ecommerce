import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'echo "Ensure backend is running on port 5000"',
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'echo "Ensure frontend is running on port 3000"',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});

