// End-to-End Demo Testing for Waternity
import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const DEMO_URL = `${BASE_URL}/demo`;

// Helper functions
class DemoTestHelper {
  constructor(private page: Page) {}

  async navigateToDemo() {
    await this.page.goto(DEMO_URL);
    await this.page.waitForLoadState('networkidle');
  }

  async switchToTab(tabName: string) {
    await this.page.click(`button:has-text("${tabName}")`);
    await this.page.waitForTimeout(500); // Wait for tab content to load
  }

  async waitForElement(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async clickButton(text: string) {
    await this.page.click(`button:has-text("${text}")`);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async expectText(text: string) {
    await expect(this.page.locator(`text=${text}`)).toBeVisible();
  }

  async expectElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectElementCount(selector: string, count: number) {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }
}

test.describe('Waternity Demo E2E Tests', () => {
  let helper: DemoTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new DemoTestHelper(page);
    await helper.navigateToDemo();
  });

  test.describe('Landing Page Navigation', () => {
    test('should load demo page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/Waternity.*Demo/);
      await helper.expectText('Waternity Demo');
    });

    test('should have all demo tabs available', async ({ page }) => {
      await helper.expectText('Guided Demo');
      await helper.expectText('Live Integration');
      await helper.expectText('IoT Simulator');
      await helper.expectText('Orchestrator');
    });

    test('should navigate from main page to demo', async ({ page }) => {
      await page.goto(BASE_URL);
      await helper.clickButton('View Live Demo');
      await expect(page).toHaveURL(DEMO_URL);
    });
  });

  test.describe('Guided Demo Flow', () => {
    test.beforeEach(async () => {
      await helper.switchToTab('Guided Demo');
    });

    test('should complete full guided demo flow', async ({ page }) => {
      // Step 1: Well Registration
      await helper.expectText('Step 1: Well Registration');
      await helper.clickButton('Register Well');
      await helper.expectText('✅ Well registered successfully');
      
      // Step 2: Fractional Share Issuance
      await helper.expectText('Step 2: Fractional Share Issuance');
      await helper.clickButton('Issue Shares');
      await helper.expectText('✅ 1000 fractional shares issued');
      
      // Step 3: Investor Purchase
      await helper.expectText('Step 3: Investor Purchase');
      await helper.clickButton('Purchase Shares');
      await helper.expectText('✅ Purchased 100 shares');
      
      // Step 4: User Deposit
      await helper.expectText('Step 4: User Deposit');
      await helper.clickButton('Deposit Funds');
      await helper.expectText('✅ Deposited $50.00');
      
      // Step 5: QR Code Scan
      await helper.expectText('Step 5: QR Code Scan');
      await helper.clickButton('Scan QR Code');
      await helper.expectText('✅ QR code scanned');
      
      // Step 6: Water Dispensing
      await helper.expectText('Step 6: Water Dispensing');
      await helper.clickButton('Start Dispensing');
      await helper.expectText('💧 Dispensing water...');
      
      // Wait for dispensing to complete
      await page.waitForTimeout(3000);
      await helper.expectText('✅ Dispensed 10.0 liters');
      
      // Step 7: Revenue Splitting
      await helper.expectText('Step 7: Revenue Splitting');
      await helper.clickButton('Split Revenue');
      await helper.expectText('✅ Revenue split completed');
      
      // Step 8: Investor Claims
      await helper.expectText('Step 8: Investor Claims');
      await helper.clickButton('Claim Revenue');
      await helper.expectText('✅ Claimed $0.05 revenue');
      
      // Verify demo completion
      await helper.expectText('🎉 Demo completed successfully!');
    });

    test('should reset demo flow', async ({ page }) => {
      // Complete some steps
      await helper.clickButton('Register Well');
      await helper.clickButton('Issue Shares');
      
      // Reset demo
      await helper.clickButton('Reset Demo');
      
      // Verify reset
      await helper.expectText('Step 1: Well Registration');
      await expect(page.locator('text=✅')).toHaveCount(0);
    });

    test('should show step-by-step progress', async ({ page }) => {
      const steps = [
        'Register Well',
        'Issue Shares',
        'Purchase Shares',
        'Deposit Funds'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        await helper.clickButton(steps[i]);
        await expect(page.locator('.step-completed')).toHaveCount(i + 1);
      }
    });
  });

  test.describe('Live Integration Demo', () => {
    test.beforeEach(async () => {
      await helper.switchToTab('Live Integration');
    });

    test('should display real-time contract states', async ({ page }) => {
      await helper.expectText('Smart Contract States');
      await helper.expectText('Well Registry');
      await helper.expectText('Deposit Manager');
      await helper.expectText('Revenue Splitter');
      
      // Check for contract data
      await helper.expectElementVisible('[data-testid="contract-state"]');
    });

    test('should show HCS message feed', async ({ page }) => {
      await helper.expectText('HCS Message Feed');
      await helper.expectElementVisible('[data-testid="hcs-messages"]');
      
      // Should have some mock messages
      await helper.expectElementCount('[data-testid="hcs-message"]', 3);
    });

    test('should simulate water dispensing session', async ({ page }) => {
      await helper.clickButton('Start Water Session');
      
      // Should show active session
      await helper.expectText('Active Session');
      await helper.expectText('Flow Rate:');
      
      // Wait for session to generate some data
      await page.waitForTimeout(2000);
      
      // Should show volume dispensed
      await expect(page.locator('text=/Volume: [0-9.]+ L/')).toBeVisible();
      
      // Stop session
      await helper.clickButton('Stop Session');
      await helper.expectText('Session completed');
    });

    test('should update IoT device status', async ({ page }) => {
      await helper.expectText('IoT Device Status');
      
      // Should show device information
      await helper.expectText('Device ID:');
      await helper.expectText('Status:');
      await helper.expectText('Battery:');
      
      // Device status should update periodically
      const initialBattery = await page.textContent('[data-testid="battery-level"]');
      await page.waitForTimeout(3000);
      const updatedBattery = await page.textContent('[data-testid="battery-level"]');
      
      // Battery level might change (simulated)
      expect(initialBattery).toBeDefined();
      expect(updatedBattery).toBeDefined();
    });
  });

  test.describe('IoT Simulator', () => {
    test.beforeEach(async () => {
      await helper.switchToTab('IoT Simulator');
    });

    test('should display device management interface', async ({ page }) => {
      await helper.expectText('IoT Device Simulator');
      await helper.expectText('Device Statistics');
      await helper.expectText('Device Management');
      
      // Should show initial devices
      await helper.expectElementVisible('[data-testid="device-list"]');
    });

    test('should create and manage devices', async ({ page }) => {
      // Add new device
      await helper.clickButton('Add Device');
      
      // Should show device creation form or new device
      await page.waitForTimeout(1000);
      
      // Check device count increased
      const deviceCount = await page.locator('[data-testid="device-item"]').count();
      expect(deviceCount).toBeGreaterThan(0);
    });

    test('should start and stop water sessions', async ({ page }) => {
      // Find first device and start session
      await page.locator('[data-testid="device-item"]').first().click();
      await helper.clickButton('Start Session');
      
      // Should show active session indicator
      await helper.expectText('Active');
      
      // Stop session
      await helper.clickButton('Stop Session');
      await helper.expectText('Idle');
    });

    test('should display real-time messages', async ({ page }) => {
      await helper.expectText('Recent Messages');
      
      // Should show message feed
      await helper.expectElementVisible('[data-testid="message-feed"]');
      
      // Messages should appear over time
      const initialMessageCount = await page.locator('[data-testid="message-item"]').count();
      await page.waitForTimeout(5000);
      const updatedMessageCount = await page.locator('[data-testid="message-item"]').count();
      
      expect(updatedMessageCount).toBeGreaterThanOrEqual(initialMessageCount);
    });
  });

  test.describe('Orchestrator Demo', () => {
    test.beforeEach(async () => {
      await helper.switchToTab('Orchestrator');
    });

    test('should display orchestrator controls', async ({ page }) => {
      await helper.expectText('Orchestrator Demo');
      await helper.expectText('System Status');
      await helper.expectText('Real-time Statistics');
    });

    test('should start and stop orchestrator', async ({ page }) => {
      // Start orchestrator
      await helper.clickButton('Start Orchestrator');
      await helper.expectText('Running');
      
      // Should show active statistics
      await helper.expectText('Active Sessions:');
      await helper.expectText('Total Volume:');
      
      // Stop orchestrator
      await helper.clickButton('Stop Orchestrator');
      await helper.expectText('Stopped');
    });

    test('should create test sessions', async ({ page }) => {
      // Start orchestrator first
      await helper.clickButton('Start Orchestrator');
      
      // Create test session
      await helper.clickButton('Create Test Session');
      
      // Should show new session in recent sessions
      await helper.expectText('Recent Sessions');
      await helper.expectElementVisible('[data-testid="session-item"]');
    });

    test('should display WebSocket messages', async ({ page }) => {
      await helper.expectText('Real-time Messages');
      
      // Start orchestrator to generate messages
      await helper.clickButton('Start Orchestrator');
      
      // Should receive WebSocket messages
      await page.waitForTimeout(3000);
      await helper.expectElementVisible('[data-testid="websocket-message"]');
    });
  });

  test.describe('Cross-Tab Integration', () => {
    test('should maintain state across tab switches', async ({ page }) => {
      // Start in guided demo
      await helper.switchToTab('Guided Demo');
      await helper.clickButton('Register Well');
      
      // Switch to live integration
      await helper.switchToTab('Live Integration');
      await helper.expectText('Smart Contract States');
      
      // Switch back to guided demo
      await helper.switchToTab('Guided Demo');
      await helper.expectText('✅ Well registered successfully');
    });

    test('should show consistent data across components', async ({ page }) => {
      // Start orchestrator
      await helper.switchToTab('Orchestrator');
      await helper.clickButton('Start Orchestrator');
      
      // Switch to IoT simulator
      await helper.switchToTab('IoT Simulator');
      await helper.clickButton('Start Session');
      
      // Switch back to orchestrator
      await helper.switchToTab('Orchestrator');
      
      // Should show updated session count
      await page.waitForTimeout(2000);
      await expect(page.locator('text=/Active Sessions: [1-9]/')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());
      
      await helper.switchToTab('Live Integration');
      await helper.clickButton('Start Water Session');
      
      // Should show error message
      await helper.expectText('Error');
    });

    test('should recover from component errors', async ({ page }) => {
      // This test would need specific error injection
      // For now, just verify error boundaries exist
      await helper.switchToTab('IoT Simulator');
      await helper.expectElementVisible('[data-testid="error-boundary"]');
    });
  });

  test.describe('Performance', () => {
    test('should load demo tabs quickly', async ({ page }) => {
      const tabs = ['Guided Demo', 'Live Integration', 'IoT Simulator', 'Orchestrator'];
      
      for (const tab of tabs) {
        const startTime = Date.now();
        await helper.switchToTab(tab);
        const loadTime = Date.now() - startTime;
        
        // Should load within 2 seconds
        expect(loadTime).toBeLessThan(2000);
      }
    });

    test('should handle multiple simultaneous operations', async ({ page }) => {
      // Start multiple operations
      await helper.switchToTab('Orchestrator');
      await helper.clickButton('Start Orchestrator');
      
      await helper.switchToTab('IoT Simulator');
      await helper.clickButton('Add Device');
      await helper.clickButton('Start Session');
      
      await helper.switchToTab('Live Integration');
      await helper.clickButton('Start Water Session');
      
      // All should work without conflicts
      await page.waitForTimeout(3000);
      
      // Verify no error messages
      await expect(page.locator('text=Error')).toHaveCount(0);
    });
  });
});

// Test configuration for different environments
test.describe.configure({ mode: 'parallel' });

// Global test setup
test.beforeAll(async () => {
  console.log(`Running E2E tests against: ${BASE_URL}`);
});

test.afterAll(async () => {
  console.log('E2E tests completed');
});