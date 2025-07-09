import { Page } from '@playwright/test';

export interface TestRouting {
  name: string;
  productIdentifier: string;
  operations: TestOperation[];
}

export interface TestOperation {
  sequence: number;
  title: string;
  orgId: string;
  targetTimeSeconds: number;
  instructions: string;
  dataInputSchema: any[];
}

export interface TestOrder {
  productIdentifier: string;
  quantity: number;
  routingId?: string;
  launchDate?: string;
  dueDate?: string;
  erpReference?: string;
}

export interface TestPauseReason {
  reasonCode: string;
  description: string;
  isActive: boolean;
}

export class APIHelper {
  constructor(private page: Page) {}

  async createRouting(routing: TestRouting): Promise<string> {
    const response = await this.page.request.post('/api/routings', {
      data: routing
    });
    const result = await response.json();
    return result.id;
  }

  async createOrder(order: TestOrder): Promise<string> {
    const response = await this.page.request.post('/api/orders', {
      data: order
    });
    const result = await response.json();
    return result.id;
  }

  async createPauseReason(pauseReason: TestPauseReason): Promise<string> {
    const response = await this.page.request.post('/api/pause-reasons', {
      data: pauseReason
    });
    const result = await response.json();
    return result.id;
  }

  async getOrders(): Promise<any[]> {
    const response = await this.page.request.get('/api/orders');
    return await response.json();
  }

  async startWOO(wooId: string): Promise<void> {
    await this.page.request.post(`/api/work-order-operations/${wooId}/start`);
  }

  async completeWOO(wooId: string, capturedData?: any): Promise<void> {
    await this.page.request.post(`/api/work-order-operations/${wooId}/complete`, {
      data: { capturedData }
    });
  }
}

export class TestDataGenerator {
  private static counter = 0;

  static getUniqueId(): string {
    return `test-${Date.now()}-${++this.counter}`;
  }

  static createRouting(overrides: Partial<TestRouting> = {}): TestRouting {
    const id = this.getUniqueId();
    return {
      name: `Test Routing ${id}`,
      productIdentifier: `PRODUCT-${id}`,
      operations: [
        {
          sequence: 1,
          title: 'Initial Assembly',
          orgId: 'org-1',
          targetTimeSeconds: 1800, // 30 minutes
          instructions: 'Assemble main components according to specifications',
          dataInputSchema: [
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
          sequence: 2,
          title: 'Quality Check',
          orgId: 'org-2',
          targetTimeSeconds: 900, // 15 minutes
          instructions: 'Perform quality inspection and record results',
          dataInputSchema: [
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
      ],
      ...overrides
    };
  }

  static createOrder(overrides: Partial<TestOrder> = {}): TestOrder {
    const id = this.getUniqueId();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      productIdentifier: `PRODUCT-${id}`,
      quantity: 50,
      launchDate: tomorrow.toISOString().split('T')[0],
      dueDate: nextWeek.toISOString().split('T')[0],
      erpReference: `ERP-${id}`,
      ...overrides
    };
  }

  static createPauseReason(overrides: Partial<TestPauseReason> = {}): TestPauseReason {
    const id = this.getUniqueId();
    return {
      reasonCode: `REASON-${id}`,
      description: `Test pause reason ${id}`,
      isActive: true,
      ...overrides
    };
  }

  static createPauseReasons(): TestPauseReason[] {
    return [
      {
        reasonCode: 'MACH_DOWN',
        description: 'Machine Breakdown',
        isActive: true
      },
      {
        reasonCode: 'MATERIAL_WAIT',
        description: 'Waiting for Materials',
        isActive: true
      },
      {
        reasonCode: 'BREAK_TIME',
        description: 'Scheduled Break',
        isActive: true
      },
      {
        reasonCode: 'MAINTENANCE',
        description: 'Scheduled Maintenance',
        isActive: true
      }
    ];
  }
}

export class APIHelper {
  constructor(private page: Page) {}

  async createRouting(routing: TestRouting): Promise<string> {
    const response = await this.page.request.post('/api/routings', {
      data: routing
    });

    if (!response.ok()) {
      throw new Error(`Failed to create routing: ${response.status()} ${await response.text()}`);
    }

    const result = await response.json();
    return result.id;
  }

  async createOrder(order: TestOrder): Promise<string> {
    const response = await this.page.request.post('/api/orders', {
      data: order
    });

    if (!response.ok()) {
      throw new Error(`Failed to create order: ${response.status()} ${await response.text()}`);
    }

    const result = await response.json();
    return result.id;
  }

  async createPauseReason(pauseReason: TestPauseReason): Promise<string> {
    const response = await this.page.request.post('/api/pause-reasons', {
      data: pauseReason
    });

    if (!response.ok()) {
      throw new Error(`Failed to create pause reason: ${response.status()} ${await response.text()}`);
    }

    const result = await response.json();
    return result.id;
  }

  async getOrders(): Promise<any[]> {
    const response = await this.page.request.get('/api/orders');

    if (!response.ok()) {
      throw new Error(`Failed to get orders: ${response.status()}`);
    }

    return await response.json();
  }

  async getWorkOrderOperations(orgId?: string): Promise<any[]> {
    const url = orgId ? `/api/work-order-operations?orgId=${orgId}` : '/api/work-order-operations';
    const response = await this.page.request.get(url);

    if (!response.ok()) {
      throw new Error(`Failed to get work order operations: ${response.status()}`);
    }

    return await response.json();
  }

  async startWOO(wooId: string): Promise<void> {
    const response = await this.page.request.post(`/api/work-order-operations/${wooId}/start`);

    if (!response.ok()) {
      throw new Error(`Failed to start WOO: ${response.status()}`);
    }
  }

  async completeWOO(wooId: string, capturedData: any): Promise<void> {
    const response = await this.page.request.post(`/api/work-order-operations/${wooId}/complete`, {
      data: { capturedData }
    });

    if (!response.ok()) {
      throw new Error(`Failed to complete WOO: ${response.status()}`);
    }
  }

  async pauseWOO(wooId: string, pauseReasonId: string): Promise<void> {
    const response = await this.page.request.post(`/api/work-order-operations/${wooId}/pause`, {
      data: { pauseReasonId }
    });

    if (!response.ok()) {
      throw new Error(`Failed to pause WOO: ${response.status()}`);
    }
  }

  async resumeWOO(wooId: string): Promise<void> {
    const response = await this.page.request.post(`/api/work-order-operations/${wooId}/resume`);

    if (!response.ok()) {
      throw new Error(`Failed to resume WOO: ${response.status()}`);
    }
  }
}
