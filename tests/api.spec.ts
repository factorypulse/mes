import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth';
import { TestDataGenerator } from './utils/test-data';

test.describe('API Endpoints', () => {
  let auth: AuthHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    await auth.login();
  });

  test.describe('Orders API', () => {
    test('should create order via API', async ({ page }) => {
      // First create a routing for the order
      const routingData = {
        name: 'API Test Routing',
        productIdentifier: 'API-001',
        operations: [
          {
            sequence: 1,
            title: 'API Test Operation',
            orgId: 'org-1',
            targetTimeSeconds: 1800,
            instructions: 'Test operation for API',
            dataInputSchema: [
              {
                name: 'test_field',
                label: 'Test Field',
                type: 'number',
                required: true
              }
            ]
          }
        ]
      };

      const routingResponse = await page.request.post('/api/routings', {
        data: routingData
      });

      expect(routingResponse.ok()).toBeTruthy();
      const routing = await routingResponse.json();

      // Create order via API
      const orderData = {
        productIdentifier: 'API-001',
        quantity: 25,
        mes_routing_id: routing.id,
        launch_date: '2025-01-20',
        erp_production_order_reference: 'API-ERP-001'
      };

      const orderResponse = await page.request.post('/api/orders', {
        data: orderData
      });

      expect(orderResponse.ok()).toBeTruthy();
      const order = await orderResponse.json();

      expect(order.productIdentifier).toBe('API-001');
      expect(order.quantity).toBe(25);
      expect(order.status).toBe('Pending');
      expect(order.orderNumber).toBeTruthy();
    });

    test('should get orders list via API', async ({ page }) => {
      const response = await page.request.get('/api/orders');

      expect(response.ok()).toBeTruthy();
      const orders = await response.json();

      expect(Array.isArray(orders)).toBeTruthy();

      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('orderNumber');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('productIdentifier');
        expect(order).toHaveProperty('quantity');
      }
    });

    test('should filter orders by status via API', async ({ page }) => {
      const response = await page.request.get('/api/orders?status=Pending');

      expect(response.ok()).toBeTruthy();
      const orders = await response.json();

      expect(Array.isArray(orders)).toBeTruthy();

      // All returned orders should have 'Pending' status
      orders.forEach(order => {
        expect(order.status).toBe('Pending');
      });
    });

    test('should get specific order details via API', async ({ page }) => {
      // First create an order
      const orderData = TestDataGenerator.createOrder();
      const createResponse = await page.request.post('/api/orders', {
        data: orderData
      });

      const createdOrder = await createResponse.json();

      // Get the specific order
      const response = await page.request.get(`/api/orders/${createdOrder.id}`);

      expect(response.ok()).toBeTruthy();
      const order = await response.json();

      expect(order.id).toBe(createdOrder.id);
      expect(order.productIdentifier).toBe(orderData.productIdentifier);
    });
  });

  test.describe('Work Order Operations API', () => {
    test('should start WOO via API', async ({ page }) => {
      // Setup: Create routing and order first
      const routing = TestDataGenerator.createRouting();
      const routingResponse = await page.request.post('/api/routings', {
        data: routing
      });
      const createdRouting = await routingResponse.json();

      const order = TestDataGenerator.createOrder({
        routingId: createdRouting.id
      });
      const orderResponse = await page.request.post('/api/orders', {
        data: order
      });
      const createdOrder = await orderResponse.json();

      // Get the first WOO
      const woosResponse = await page.request.get(`/api/work-order-operations?orderId=${createdOrder.id}`);
      const woos = await woosResponse.json();
      const firstWOO = woos[0];

      // Start the WOO
      const startResponse = await page.request.post(`/api/work-order-operations/${firstWOO.id}/start`);

      expect(startResponse.ok()).toBeTruthy();

      // Verify WOO status changed
      const updatedWOOResponse = await page.request.get(`/api/work-order-operations/${firstWOO.id}`);
      const updatedWOO = await updatedWOOResponse.json();

      expect(updatedWOO.status).toBe('In Progress');
      expect(updatedWOO.actualStartTime).toBeTruthy();
    });

    test('should pause and resume WOO via API', async ({ page }) => {
      // Setup WOO and start it
      const routing = TestDataGenerator.createRouting();
      const routingResponse = await page.request.post('/api/routings', {
        data: routing
      });
      const createdRouting = await routingResponse.json();

      const order = TestDataGenerator.createOrder({
        routingId: createdRouting.id
      });
      const orderResponse = await page.request.post('/api/orders', {
        data: order
      });
      const createdOrder = await orderResponse.json();

      // Create pause reason
      const pauseReason = TestDataGenerator.createPauseReason();
      const pauseReasonResponse = await page.request.post('/api/pause-reasons', {
        data: pauseReason
      });
      const createdPauseReason = await pauseReasonResponse.json();

      // Get and start WOO
      const woosResponse = await page.request.get(`/api/work-order-operations?orderId=${createdOrder.id}`);
      const woos = await woosResponse.json();
      const firstWOO = woos[0];

      await page.request.post(`/api/work-order-operations/${firstWOO.id}/start`);

      // Pause the WOO
      const pauseResponse = await page.request.post(`/api/work-order-operations/${firstWOO.id}/pause`, {
        data: { pauseReasonId: createdPauseReason.id }
      });

      expect(pauseResponse.ok()).toBeTruthy();

      // Verify WOO is paused
      let wooResponse = await page.request.get(`/api/work-order-operations/${firstWOO.id}`);
      let woo = await wooResponse.json();
      expect(woo.status).toBe('Paused');

      // Resume the WOO
      const resumeResponse = await page.request.post(`/api/work-order-operations/${firstWOO.id}/resume`);

      expect(resumeResponse.ok()).toBeTruthy();

      // Verify WOO is resumed
      wooResponse = await page.request.get(`/api/work-order-operations/${firstWOO.id}`);
      woo = await wooResponse.json();
      expect(woo.status).toBe('In Progress');
    });

    test('should complete WOO with captured data via API', async ({ page }) => {
      // Setup WOO and start it
      const routing = TestDataGenerator.createRouting();
      const routingResponse = await page.request.post('/api/routings', {
        data: routing
      });
      const createdRouting = await routingResponse.json();

      const order = TestDataGenerator.createOrder({
        routingId: createdRouting.id
      });
      const orderResponse = await page.request.post('/api/orders', {
        data: order
      });
      const createdOrder = await orderResponse.json();

      // Get and start WOO
      const woosResponse = await page.request.get(`/api/work-order-operations?orderId=${createdOrder.id}`);
      const woos = await woosResponse.json();
      const firstWOO = woos[0];

      await page.request.post(`/api/work-order-operations/${firstWOO.id}/start`);

      // Complete the WOO with data
      const capturedData = {
        measurement_a: 42.5,
        qc_passed: true
      };

      const completeResponse = await page.request.post(`/api/work-order-operations/${firstWOO.id}/complete`, {
        data: {
          capturedData,
          quantityCompleted: 0,
          quantityRejected: 0,
          notes: null
        }
      });

      expect(completeResponse.ok()).toBeTruthy();

      // Verify WOO is completed with data
      const wooResponse = await page.request.get(`/api/work-order-operations/${firstWOO.id}`);
      const woo = await wooResponse.json();

      expect(woo.status).toBe('Completed');
      expect(woo.actualEndTime).toBeTruthy();
      expect(woo.totalActiveTimeSeconds).toBeTruthy();
      expect(woo.capturedData).toEqual(capturedData);
    });

    test('should get WOOs filtered by organization via API', async ({ page }) => {
      const response = await page.request.get('/api/work-order-operations?orgId=org-1');

      expect(response.ok()).toBeTruthy();
      const woos = await response.json();

      expect(Array.isArray(woos)).toBeTruthy();

      // All returned WOOs should be for org-1
      woos.forEach(woo => {
        expect(woo.orgId).toBe('org-1');
      });
    });
  });

  test.describe('Pause Reasons API', () => {
    test('should create pause reason via API', async ({ page }) => {
      const pauseReasonData = {
        reasonCode: 'MAINT_BREAK',
        description: 'Maintenance Break',
        isActive: true
      };

      const response = await page.request.post('/api/pause-reasons', {
        data: pauseReasonData
      });

      expect(response.ok()).toBeTruthy();
      const pauseReason = await response.json();

      expect(pauseReason.reasonCode).toBe('MAINT_BREAK');
      expect(pauseReason.description).toBe('Maintenance Break');
      expect(pauseReason.isActive).toBe(true);
    });

    test('should get pause reasons list via API', async ({ page }) => {
      const response = await page.request.get('/api/pause-reasons');

      expect(response.ok()).toBeTruthy();
      const pauseReasons = await response.json();

      expect(Array.isArray(pauseReasons)).toBeTruthy();

      if (pauseReasons.length > 0) {
        const reason = pauseReasons[0];
        expect(reason).toHaveProperty('id');
        expect(reason).toHaveProperty('reasonCode');
        expect(reason).toHaveProperty('description');
        expect(reason).toHaveProperty('isActive');
      }
    });

    test('should get only active pause reasons via API', async ({ page }) => {
      const response = await page.request.get('/api/pause-reasons?active=true');

      expect(response.ok()).toBeTruthy();
      const pauseReasons = await response.json();

      expect(Array.isArray(pauseReasons)).toBeTruthy();

      // All returned reasons should be active
      pauseReasons.forEach(reason => {
        expect(reason.isActive).toBe(true);
      });
    });

    test('should update pause reason via API', async ({ page }) => {
      // Create a pause reason first
      const pauseReasonData = TestDataGenerator.createPauseReason();
      const createResponse = await page.request.post('/api/pause-reasons', {
        data: pauseReasonData
      });
      const createdReason = await createResponse.json();

      // Update the pause reason
      const updateData = {
        description: 'Updated Description',
        isActive: false
      };

      const updateResponse = await page.request.put(`/api/pause-reasons/${createdReason.id}`, {
        data: updateData
      });

      expect(updateResponse.ok()).toBeTruthy();

      // Verify the update
      const getResponse = await page.request.get(`/api/pause-reasons/${createdReason.id}`);
      const updatedReason = await getResponse.json();

      expect(updatedReason.description).toBe('Updated Description');
      expect(updatedReason.isActive).toBe(false);
    });

    test('should get pause reason usage statistics via API', async ({ page }) => {
      const response = await page.request.get('/api/pause-reasons/usage');

      expect(response.ok()).toBeTruthy();
      const usageStats = await response.json();

      expect(Array.isArray(usageStats)).toBeTruthy();

      if (usageStats.length > 0) {
        const stat = usageStats[0];
        expect(stat).toHaveProperty('reasonCode');
        expect(stat).toHaveProperty('description');
        expect(stat).toHaveProperty('usageCount');
        expect(stat).toHaveProperty('totalDurationSeconds');
      }
    });
  });

  test.describe('Routings API', () => {
    test('should create routing with operations via API', async ({ page }) => {
      const routingData = TestDataGenerator.createRouting();

      const response = await page.request.post('/api/routings', {
        data: routingData
      });

      expect(response.ok()).toBeTruthy();
      const routing = await response.json();

      expect(routing.name).toBe(routingData.name);
      expect(routing.productIdentifier).toBe(routingData.productIdentifier);
      expect(routing.isActive).toBe(true);
      expect(Array.isArray(routing.operations)).toBeTruthy();
      expect(routing.operations.length).toBe(routingData.operations.length);
    });

    test('should get routings list via API', async ({ page }) => {
      const response = await page.request.get('/api/routings');

      expect(response.ok()).toBeTruthy();
      const routings = await response.json();

      expect(Array.isArray(routings)).toBeTruthy();

      if (routings.length > 0) {
        const routing = routings[0];
        expect(routing).toHaveProperty('id');
        expect(routing).toHaveProperty('name');
        expect(routing).toHaveProperty('productIdentifier');
        expect(routing).toHaveProperty('isActive');
      }
    });

    test('should get only active routings via API', async ({ page }) => {
      const response = await page.request.get('/api/routings?active=true');

      expect(response.ok()).toBeTruthy();
      const routings = await response.json();

      expect(Array.isArray(routings)).toBeTruthy();

      // All returned routings should be active
      routings.forEach(routing => {
        expect(routing.isActive).toBe(true);
      });
    });

    test('should archive routing via API', async ({ page }) => {
      // Create a routing first
      const routingData = TestDataGenerator.createRouting();
      const createResponse = await page.request.post('/api/routings', {
        data: routingData
      });
      const createdRouting = await createResponse.json();

      // Archive the routing
      const archiveResponse = await page.request.put(`/api/routings/${createdRouting.id}`, {
        data: { isActive: false }
      });

      expect(archiveResponse.ok()).toBeTruthy();

      // Verify routing is archived
      const getResponse = await page.request.get(`/api/routings/${createdRouting.id}`);
      const archivedRouting = await getResponse.json();

      expect(archivedRouting.isActive).toBe(false);
    });
  });

  test.describe('Error Handling', () => {
    test('should return 404 for non-existent resources', async ({ page }) => {
      const response = await page.request.get('/api/orders/non-existent-id');
      expect(response.status()).toBe(404);
    });

    test('should return 400 for invalid data', async ({ page }) => {
      const invalidOrderData = {
        // Missing required fields
        productIdentifier: '',
        quantity: -1
      };

      const response = await page.request.post('/api/orders', {
        data: invalidOrderData
      });

      expect(response.status()).toBe(400);
    });

    test('should handle concurrent WOO start attempts', async ({ page }) => {
      // Setup WOO
      const routing = TestDataGenerator.createRouting();
      const routingResponse = await page.request.post('/api/routings', {
        data: routing
      });
      const createdRouting = await routingResponse.json();

      const order = TestDataGenerator.createOrder({
        routingId: createdRouting.id
      });
      const orderResponse = await page.request.post('/api/orders', {
        data: order
      });
      const createdOrder = await orderResponse.json();

      // Get WOO
      const woosResponse = await page.request.get(`/api/work-order-operations?orderId=${createdOrder.id}`);
      const woos = await woosResponse.json();
      const firstWOO = woos[0];

      // Start WOO first time
      const firstStartResponse = await page.request.post(`/api/work-order-operations/${firstWOO.id}/start`);
      expect(firstStartResponse.ok()).toBeTruthy();

      // Try to start same WOO again
      const secondStartResponse = await page.request.post(`/api/work-order-operations/${firstWOO.id}/start`);
      expect(secondStartResponse.status()).toBe(400); // Should fail
    });
  });
});
