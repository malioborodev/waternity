// Test Configuration for Waternity
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CI = !!process.env.CI;

export default defineConfig({
  // Test directory
  testDir: '../e2e',
  
  // Global test timeout
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: CI,
  
  // Retry on CI only
  retries: CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: '../test-results/html-report' }],
    ['json', { outputFile: '../test-results/results.json' }],
    ['junit', { outputFile: '../test-results/junit.xml' }],
    CI ? ['github'] : ['list']
  ],
  
  // Global test setup
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  
  // Shared settings for all projects
  use: {
    // Base URL for all tests
    baseURL: BASE_URL,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 15000,
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !CI,
    timeout: 120000,
  },
  
  // Output directory for test artifacts
  outputDir: '../test-results/artifacts',
});

// Environment-specific configurations
if (process.env.NODE_ENV === 'development') {
  // Development-specific settings
  module.exports.use.headless = false;
  module.exports.use.slowMo = 100;
}

if (process.env.NODE_ENV === 'production') {
  // Production testing settings
  module.exports.timeout = 60000;
  module.exports.expect.timeout = 10000;
}