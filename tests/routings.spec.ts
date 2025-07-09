import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth';
import { TestDataGenerator } from './utils/test-data';
import { RoutingsPage } from './pages/routings-page';

test.describe('Routings Management', () => {
  let auth: AuthHelper;
  let routingsPage: RoutingsPage;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    routingsPage = new RoutingsPage(page);

    await auth.login();
  });

  test('should create a new routing with operations', async ({ page }) => {
    const routingData = {
      name: 'Test Widget Assembly',
      productIdentifier: 'WIDGET-001',
      operations: [
        {
          title: 'Initial Assembly',
          orgId: 'org-1',
          targetTimeMinutes: 30,
          instructions: 'Assemble main components according to specifications',
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
          title: 'Quality Check',
          orgId: 'org-2',
          targetTimeMinutes: 15,
          instructions: 'Perform quality inspection'
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Verify routing was created
    await routingsPage.verifyRoutingExists(routingData.name);
  });

  test('should edit an existing routing', async ({ page }) => {
    // First create a routing
    const originalRouting = {
      name: 'Original Routing',
      productIdentifier: 'ORIG-001',
      operations: [
        {
          title: 'Test Operation',
          orgId: 'org-1',
          targetTimeMinutes: 20,
          instructions: 'Original instructions'
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(originalRouting);

    // Edit the routing
    const updates = {
      name: 'Updated Routing Name',
      productIdentifier: 'UPD-001'
    };

    await routingsPage.editRouting(originalRouting.name, updates);

    // Verify the original name no longer exists
    await routingsPage.verifyRoutingNotExists(originalRouting.name);

    // Verify the updated name exists
    await routingsPage.verifyRoutingExists(updates.name);
  });

  test('should archive a routing', async ({ page }) => {
    const routingData = {
      name: 'Routing to Archive',
      productIdentifier: 'ARCH-001',
      operations: [
        {
          title: 'Test Operation',
          orgId: 'org-1',
          targetTimeMinutes: 15,
          instructions: 'Test instructions'
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Archive the routing
    await routingsPage.archiveRouting(routingData.name);

    // Verify routing is no longer in active list
    await routingsPage.verifyRoutingNotExists(routingData.name);
  });

  test('should display operations in correct sequence order', async ({ page }) => {
    const routingData = {
      name: 'Sequence Test Routing',
      productIdentifier: 'SEQ-001',
      operations: [
        {
          title: 'Operation 1',
          orgId: 'org-1',
          targetTimeMinutes: 10,
          instructions: 'First operation'
        },
        {
          title: 'Operation 2',
          orgId: 'org-2',
          targetTimeMinutes: 15,
          instructions: 'Second operation'
        },
        {
          title: 'Operation 3',
          orgId: 'org-1',
          targetTimeMinutes: 20,
          instructions: 'Third operation'
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Select the routing to view details
    await routingsPage.selectRouting(routingData.name);

    // Verify operations are displayed in sequence order
    const operationsList = page.locator('[data-testid="operations-list"], .operations-list');
    const operations = await operationsList.locator('.operation-item, [data-testid="operation-item"]').all();

    expect(operations.length).toBe(3);

    // Check sequence numbers or titles are in correct order
    await expect(operations[0]).toContainText('Operation 1');
    await expect(operations[1]).toContainText('Operation 2');
    await expect(operations[2]).toContainText('Operation 3');
  });

  test('should validate required fields when creating routing', async ({ page }) => {
    await routingsPage.goto();

    // Try to create routing without required fields
    await routingsPage.createButton.click();

    const dialog = page.locator('[data-testid="routing-dialog"], .routing-dialog');
    await expect(dialog).toBeVisible();

    // Try to save without filling required fields
    await dialog.locator('button:has-text("Save"), button:has-text("Create"), [data-testid="save-routing"]').click();

    // Should show validation errors
    await expect(dialog.locator('.error, [data-testid="error"], .field-error')).toBeVisible();
  });

  test('should support data input schema for operations', async ({ page }) => {
    const routingData = {
      name: 'Data Schema Test',
      productIdentifier: 'DATA-001',
      operations: [
        {
          title: 'Data Collection Operation',
          orgId: 'org-1',
          targetTimeMinutes: 25,
          instructions: 'Collect measurements and QC data',
          dataInputs: [
            {
              name: 'length',
              label: 'Length (mm)',
              type: 'number',
              required: true
            },
            {
              name: 'width',
              label: 'Width (mm)',
              type: 'number',
              required: true
            },
            {
              name: 'notes',
              label: 'Notes',
              type: 'text',
              required: false
            },
            {
              name: 'approved',
              label: 'Approved',
              type: 'boolean',
              required: true
            }
          ]
        }
      ]
    };

    await routingsPage.goto();
    await routingsPage.createRouting(routingData);

    // Select routing and verify data inputs are displayed
    await routingsPage.selectRouting(routingData.name);

    const operationDetails = page.locator('[data-testid="operation-details"], .operation-details');
    await expect(operationDetails).toBeVisible();

    // Verify data input fields are shown
    await expect(operationDetails.locator('text="Length (mm)"')).toBeVisible();
    await expect(operationDetails.locator('text="Width (mm)"')).toBeVisible();
    await expect(operationDetails.locator('text="Notes"')).toBeVisible();
    await expect(operationDetails.locator('text="Approved"')).toBeVisible();
  });
});
