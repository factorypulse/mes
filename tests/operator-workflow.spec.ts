import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth';
import { TestDataGenerator, APIHelper } from './utils/test-data';
import { OperatorDashboardPage } from './pages/operator-dashboard';
import { RoutingsPage } from './pages/routings-page';
import { OrdersPage } from './pages/orders-page';

test.describe('Operator Workflow - Core MES Functionality', () => {
  let auth: AuthHelper;
  let operatorDashboard: OperatorDashboardPage;
  let routingsPage: RoutingsPage;
  let ordersPage: OrdersPage;
  let apiHelper: APIHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    operatorDashboard = new OperatorDashboardPage(page);
    routingsPage = new RoutingsPage(page);
    ordersPage = new OrdersPage(page);
    apiHelper = new APIHelper(page);

    await auth.login();
  });

  test('should complete full end-to-end operator workflow', async ({ page }) => {
    // Step 1: Create routing with multiple operations
    const routingData = {
      name: 'E2E Test Routing',
      productIdentifier: 'E2E-WIDGET',
      operations: [
        {
          title: 'Initial Assembly',
          orgId: 'org-1',
          targetTimeMinutes: 30,
          instructions: 'Assemble main components according to drawing A-101',
          dataInputs: [
            {
              name: 'measurement_a',
              label: 'Measurement A (mm)',
              type: 'number',
              required: true
            },
            {
              name: 'qc_passed',
              label: 'QC Passed?',
              type: 'boolean',
              required: true
            }
          ]
        },
        {
          title: 'Quality Inspection',
          orgId: 'org-2',
          targetTimeMinutes: 15,
          instructions: 'Perform quality inspection and record results',
          dataInputs: [
            {
              name: 'inspection_notes',
              label: 'Inspection Notes',
              type: 'text',
              required: false
            },
            {
              name: 'pass_fail',
              label: 'Pass/Fail',
              type: 'boolean',
              required: true
            }
          ]
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Step 2: Create order with this routing
    const orderData = {
      productIdentifier: 'E2E-WIDGET',
      quantity: 10,
      routingName: 'E2E Test Routing',
      launchDate: new Date().toISOString().split('T')[0] // Today
    };

    await ordersPage.goto();
    await ordersPage.createOrder(orderData);

    // Step 3: Navigate to operator dashboard
    await operatorDashboard.goto();

    // Step 4: Verify WOO appears in todo list
    await operatorDashboard.verifyWOOInList('todo', 'Initial Assembly');

    // Step 5: Start the first WOO
    await operatorDashboard.startWOO('Initial Assembly');
    await operatorDashboard.verifyActiveWOO('Initial Assembly');

    // Step 6: Fill data inputs
    const capturedData = {
      measurement_a: 25.5,
      qc_passed: true
    };
    await operatorDashboard.fillDataInputs(capturedData);

    // Step 7: Complete the first WOO
    await operatorDashboard.completeActiveWOO(capturedData);

    // Step 8: Verify no active WOO (since next operation is for different org)
    await operatorDashboard.verifyNoActiveWOO();

    // Step 9: Verify second WOO is now available (simulating different operator)
    // This would normally be on a different org's dashboard, but for testing
    // we'll verify the workflow progression occurred
    const orders = await apiHelper.getOrders();
    const testOrder = orders.find(order => order.productIdentifier === 'E2E-WIDGET');
    expect(testOrder.status).toBe('In Progress');
  });

  test('should handle pause and resume workflow', async ({ page }) => {
    // Setup: Create routing, order, and start WOO
    const routing = TestDataGenerator.createRouting({
      name: 'Pause Test Routing',
      operations: [
        {
          sequence: 1,
          title: 'Pausable Operation',
          orgId: 'org-1',
          targetTimeSeconds: 1800,
          instructions: 'This operation can be paused',
          dataInputSchema: []
        }
      ]
    });

    // Create via API for speed
    const routingId = await apiHelper.createRouting(routing);
    const order = TestDataGenerator.createOrder({
      productIdentifier: routing.productIdentifier,
      routingId
    });
    await apiHelper.createOrder(order);

    // Create pause reasons
    const pauseReasons = TestDataGenerator.createPauseReasons();
    for (const reason of pauseReasons) {
      await apiHelper.createPauseReason(reason);
    }

    // Start workflow
    await operatorDashboard.goto();
    await operatorDashboard.startWOO('Pausable Operation');

    // Pause the WOO
    await operatorDashboard.pauseActiveWOO('Machine Breakdown');
    await operatorDashboard.verifyWOOInList('paused', 'Pausable Operation');

    // Resume the WOO
    await operatorDashboard.resumePausedWOO('Pausable Operation');
    await operatorDashboard.verifyActiveWOO('Pausable Operation');

    // Complete the WOO
    await operatorDashboard.completeActiveWOO();
  });

  test('should validate required data inputs before completion', async ({ page }) => {
    // Create routing with required data inputs
    const routingData = {
      name: 'Validation Test Routing',
      productIdentifier: 'VAL-001',
      operations: [
        {
          title: 'Data Validation Operation',
          orgId: 'org-1',
          targetTimeMinutes: 20,
          instructions: 'Fill all required fields',
          dataInputs: [
            {
              name: 'required_measurement',
              label: 'Required Measurement',
              type: 'number',
              required: true
            },
            {
              name: 'optional_notes',
              label: 'Optional Notes',
              type: 'text',
              required: false
            },
            {
              name: 'required_approval',
              label: 'Approval Required',
              type: 'boolean',
              required: true
            }
          ]
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Create order
    const orderData = {
      productIdentifier: 'VAL-001',
      quantity: 1,
      routingName: 'Validation Test Routing'
    };

    await ordersPage.goto();
    await ordersPage.createOrder(orderData);

    // Start WOO
    await operatorDashboard.goto();
    await operatorDashboard.startWOO('Data Validation Operation');

    // Try to complete without filling required fields
    const completeButton = page.locator('[data-testid="complete-woo"], button:has-text("Complete")');
    await completeButton.click();

    // Should show validation errors
    await expect(page.locator('.error, [data-testid="validation-error"], .field-error')).toBeVisible();

    // Fill only optional field
    await operatorDashboard.fillDataInputs({
      optional_notes: 'Some notes'
    });

    // Try to complete again - should still fail
    await completeButton.click();
    await expect(page.locator('.error, [data-testid="validation-error"], .field-error')).toBeVisible();

    // Fill all required fields
    await operatorDashboard.fillDataInputs({
      required_measurement: 42.5,
      required_approval: true
    });

    // Now completion should succeed
    await operatorDashboard.completeActiveWOO();
    await operatorDashboard.verifyNoActiveWOO();
  });

  test('should handle file attachments during operation', async ({ page }) => {
    // Create routing
    const routingData = {
      name: 'Attachment Test Routing',
      productIdentifier: 'ATT-001',
      operations: [
        {
          title: 'Photo Documentation Operation',
          orgId: 'org-1',
          targetTimeMinutes: 15,
          instructions: 'Take photos of the work and upload them'
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Create order
    const orderData = {
      productIdentifier: 'ATT-001',
      quantity: 1,
      routingName: 'Attachment Test Routing'
    };

    await ordersPage.goto();
    await ordersPage.createOrder(orderData);

    // Start WOO
    await operatorDashboard.goto();
    await operatorDashboard.startWOO('Photo Documentation Operation');

    // Create a test file (simple text file for testing)
    const testFilePath = 'tests/fixtures/test-image.txt';
    await page.evaluate(() => {
      const fs = require('fs');
      fs.writeFileSync('tests/fixtures/test-image.txt', 'Test image content');
    });

    // Upload attachment
    await operatorDashboard.uploadAttachment(testFilePath, 'Test work photo');

    // Complete operation
    await operatorDashboard.completeActiveWOO();
  });

  test('should display operation instructions and timing correctly', async ({ page }) => {
    // Create routing with detailed instructions
    const routingData = {
      name: 'Instructions Test Routing',
      productIdentifier: 'INST-001',
      operations: [
        {
          title: 'Detailed Operation',
          orgId: 'org-1',
          targetTimeMinutes: 45,
          instructions: 'Follow these detailed step-by-step instructions:\n1. Check all components\n2. Assemble in sequence\n3. Verify alignment\n4. Record measurements'
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Create order
    const orderData = {
      productIdentifier: 'INST-001',
      quantity: 1,
      routingName: 'Instructions Test Routing'
    };

    await ordersPage.goto();
    await ordersPage.createOrder(orderData);

    // Start WOO and verify instructions display
    await operatorDashboard.goto();
    await operatorDashboard.startWOO('Detailed Operation');

    const wooInfo = await operatorDashboard.getActiveWOOInfo();
    expect(wooInfo.title).toContain('Detailed Operation');
    expect(wooInfo.instructions).toContain('Follow these detailed step-by-step instructions');
    expect(wooInfo.timer).toBeTruthy(); // Timer should be running

    // Wait a moment and verify timer is updating
    await page.waitForTimeout(2000);
    const updatedInfo = await operatorDashboard.getActiveWOOInfo();
    expect(updatedInfo.timer).not.toBe(wooInfo.timer); // Timer should have changed

    await operatorDashboard.completeActiveWOO();
  });

  test('should handle multi-organization workflow correctly', async ({ page }) => {
    // Create routing spanning multiple organizations
    const routingData = {
      name: 'Multi-Org Routing',
      productIdentifier: 'MULTI-001',
      operations: [
        {
          title: 'Org 1 Operation',
          orgId: 'org-1',
          targetTimeMinutes: 20,
          instructions: 'First organization operation'
        },
        {
          title: 'Org 2 Operation',
          orgId: 'org-2',
          targetTimeMinutes: 15,
          instructions: 'Second organization operation'
        },
        {
          title: 'Org 1 Final Operation',
          orgId: 'org-1',
          targetTimeMinutes: 10,
          instructions: 'Back to first organization'
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Create order
    const orderData = {
      productIdentifier: 'MULTI-001',
      quantity: 1,
      routingName: 'Multi-Org Routing'
    };

    await ordersPage.goto();
    await ordersPage.createOrder(orderData);

    // Simulate org-1 operator workflow
    await operatorDashboard.goto();

    // Should see first operation
    await operatorDashboard.verifyWOOInList('todo', 'Org 1 Operation');

    // Complete first operation
    await operatorDashboard.startWOO('Org 1 Operation');
    await operatorDashboard.completeActiveWOO();

    // Should NOT see org-2 operation (different org)
    await expect(page.locator('text="Org 2 Operation"')).not.toBeVisible();

    // Verify workflow progressed by checking order status via API
    const orders = await apiHelper.getOrders();
    const testOrder = orders.find(order => order.productIdentifier === 'MULTI-001');
    expect(testOrder.status).toBe('In Progress');

    // After org-2 completes their operation (simulated via API),
    // the final operation should become available to org-1
    // This would typically be tested with multiple browser contexts for different users
  });

  test('should handle concurrent operator access correctly', async ({ page, context }) => {
    // Create a simple routing and order
    const routingData = {
      name: 'Concurrency Test Routing',
      productIdentifier: 'CONC-001',
      operations: [
        {
          title: 'Single Operation',
          orgId: 'org-1',
          targetTimeMinutes: 10,
          instructions: 'Test operation for concurrency'
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    const orderData = {
      productIdentifier: 'CONC-001',
      quantity: 1,
      routingName: 'Concurrency Test Routing'
    };

    await ordersPage.goto();
    await ordersPage.createOrder(orderData);

    // Create second browser context to simulate another operator
    const secondContext = await context.browser()?.newContext();
    const secondPage = await secondContext?.newPage();

    if (secondPage) {
      const secondAuth = new AuthHelper(secondPage);
      const secondOperatorDashboard = new OperatorDashboardPage(secondPage);

      await secondAuth.login();
      await secondOperatorDashboard.goto();

      // Both operators should see the WOO
      await operatorDashboard.goto();
      await operatorDashboard.verifyWOOInList('todo', 'Single Operation');
      await secondOperatorDashboard.verifyWOOInList('todo', 'Single Operation');

      // First operator starts the WOO
      await operatorDashboard.startWOO('Single Operation');

      // Second operator should not be able to start the same WOO
      await secondOperatorDashboard.goto();
      await expect(secondPage.locator('text="Single Operation"')).not.toBeVisible();

      // Complete with first operator
      await page.bringToFront();
      await operatorDashboard.completeActiveWOO();

      await secondContext?.close();
    }
  });
});
