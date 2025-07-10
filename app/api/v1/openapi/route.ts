import { NextRequest, NextResponse } from 'next/server'
import { validateExternalAPIRequest } from '@/lib/middleware/external-api-auth'

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MES External API',
    description: 'Manufacturing Execution System External API for integrating with ERP systems, data collection systems, and other manufacturing software.',
    version: '1.0.0',
    contact: {
      name: 'MES API Support',
      email: 'api-support@mes.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Production server',
    },
  ],
  security: [
    {
      BearerAuth: [],
      TeamHeader: [],
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API_KEY',
        description: 'API key authentication. Use your generated API key as the bearer token.',
      },
      TeamHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-MES-Team-ID',
        description: 'Team ID header to specify which team context to operate in.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'timestamp'],
            properties: {
              code: {
                type: 'string',
                description: 'Error code for programmatic handling',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                description: 'Human-readable error message',
                example: 'Invalid request data',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'ISO 8601 timestamp when the error occurred',
              },
              requestId: {
                type: 'string',
                description: 'Unique request identifier for debugging',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
            },
          },
        },
      },
      Order: {
        type: 'object',
        required: ['id', 'productIdentifier', 'quantity', 'status'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique order identifier',
          },
          orderNumber: {
            type: 'string',
            description: 'Human-readable order number',
          },
          erpReference: {
            type: 'string',
            description: 'Reference to the order in the ERP system',
          },
          productIdentifier: {
            type: 'string',
            description: 'Product or part number being manufactured',
          },
          quantity: {
            type: 'integer',
            minimum: 1,
            description: 'Quantity to manufacture',
          },
          routingId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the routing used for this order',
          },
          priority: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Order priority (1=lowest, 5=highest)',
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            description: 'Current order status',
          },
          scheduledStartDate: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 scheduled start date',
          },
          scheduledEndDate: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 scheduled end date',
          },
          actualStartDate: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 actual start date',
          },
          notes: {
            type: 'string',
            description: 'Order notes and comments',
          },
          customFields: {
            type: 'object',
            description: 'Custom fields specific to your organization',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 last update timestamp',
          },
          workOrderOperations: {
            type: 'array',
            description: 'Associated work order operations',
            items: {
              $ref: '#/components/schemas/WorkOrderOperationSummary',
            },
          },
          progress: {
            type: 'object',
            properties: {
              completedOperations: {
                type: 'integer',
                description: 'Number of completed operations',
              },
              totalOperations: {
                type: 'integer',
                description: 'Total number of operations',
              },
              percentComplete: {
                type: 'integer',
                description: 'Completion percentage (0-100)',
              },
            },
          },
        },
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['productIdentifier', 'quantity'],
        properties: {
          orderNumber: {
            type: 'string',
            description: 'Optional custom order number',
          },
          erpReference: {
            type: 'string',
            description: 'Reference to the order in your ERP system',
          },
          productIdentifier: {
            type: 'string',
            description: 'Product or part number to manufacture',
          },
          quantity: {
            type: 'integer',
            minimum: 1,
            description: 'Quantity to manufacture',
          },
          routingId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of routing to use (either this or routingName required)',
          },
          routingName: {
            type: 'string',
            description: 'Name of routing to use (either this or routingId required)',
          },
          priority: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            default: 1,
            description: 'Order priority (1=lowest, 5=highest)',
          },
          scheduledStartDate: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 scheduled start date',
          },
          scheduledEndDate: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 scheduled end date',
          },
          notes: {
            type: 'string',
            description: 'Order notes and comments',
          },
          customFields: {
            type: 'object',
            description: 'Custom fields specific to your organization',
          },
        },
      },
      UpdateOrderRequest: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            description: 'Update order status',
          },
          priority: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Update order priority',
          },
          notes: {
            type: 'string',
            description: 'Update order notes',
          },
          customFields: {
            type: 'object',
            description: 'Update custom fields',
          },
        },
      },
      WorkOrderOperation: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique work order operation identifier',
          },
          orderId: {
            type: 'string',
            format: 'uuid',
            description: 'Associated order ID',
          },
          operationNumber: {
            type: 'integer',
            description: 'Operation sequence number',
          },
          operationName: {
            type: 'string',
            description: 'Operation name',
          },
          status: {
            type: 'string',
            enum: ['pending', 'ready', 'in_progress', 'paused', 'completed'],
            description: 'Current operation status',
          },
          departmentId: {
            type: 'string',
            format: 'uuid',
            description: 'Department where operation is performed',
          },
          operatorId: {
            type: 'string',
            format: 'uuid',
            description: 'Assigned operator ID',
          },
          estimatedDuration: {
            type: 'integer',
            description: 'Estimated duration in minutes',
          },
          actualDuration: {
            type: 'integer',
            description: 'Actual duration in minutes',
          },
          startedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 operation start time',
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 operation completion time',
          },
          pauseReason: {
            type: 'string',
            description: 'Reason for pausing (if paused)',
          },
          dataCollection: {
            type: 'array',
            description: 'Collected data for this operation',
            items: {
              type: 'object',
            },
          },
        },
      },
      WorkOrderOperationSummary: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          operationNumber: {
            type: 'integer',
          },
          operationName: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['pending', 'ready', 'in_progress', 'paused', 'completed'],
          },
          departmentId: {
            type: 'string',
            format: 'uuid',
          },
        },
      },
      WorkOrderOperationAction: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['start', 'pause', 'resume', 'complete'],
            description: 'Action to perform on the work order operation',
          },
          operatorId: {
            type: 'string',
            format: 'uuid',
            description: 'Operator ID (required for start action)',
          },
          pauseReasonId: {
            type: 'string',
            format: 'uuid',
            description: 'Pause reason ID (required for pause action)',
          },
          dataCollection: {
            type: 'object',
            description: 'Data collection results (required for complete action)',
          },
          notes: {
            type: 'string',
            description: 'Optional notes for the action',
          },
        },
      },
      Routing: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique routing identifier',
          },
          name: {
            type: 'string',
            description: 'Routing name',
          },
          productIdentifier: {
            type: 'string',
            description: 'Product or part number this routing applies to',
          },
          version: {
            type: 'string',
            description: 'Routing version',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether this routing is currently active',
          },
          operations: {
            type: 'array',
            description: 'Operations in this routing',
            items: {
              $ref: '#/components/schemas/RoutingOperation',
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      RoutingOperation: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          operationNumber: {
            type: 'integer',
            description: 'Operation sequence number',
          },
          operationName: {
            type: 'string',
            description: 'Operation name',
          },
          departmentId: {
            type: 'string',
            format: 'uuid',
            description: 'Department where operation is performed',
          },
          setupTime: {
            type: 'integer',
            description: 'Setup time in minutes',
          },
          runTime: {
            type: 'integer',
            description: 'Run time in minutes',
          },
          instructions: {
            type: 'string',
            description: 'Operation instructions',
          },
          requiredSkills: {
            type: 'array',
            description: 'Required operator skills',
            items: {
              type: 'string',
            },
          },
          dataCollectionActivities: {
            type: 'array',
            description: 'Data collection requirements',
            items: {
              type: 'object',
            },
          },
        },
      },
      DashboardMetrics: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              ordersInProgress: {
                type: 'integer',
                description: 'Number of orders currently in progress',
              },
              operationsInProgress: {
                type: 'integer',
                description: 'Number of operations currently in progress',
              },
              completedToday: {
                type: 'integer',
                description: 'Number of operations completed today',
              },
              averageCycleTime: {
                type: 'number',
                description: 'Average cycle time in hours',
              },
            },
          },
          performance: {
            type: 'object',
            properties: {
              onTimeDeliveryRate: {
                type: 'number',
                description: 'On-time delivery rate as percentage',
              },
              overallEfficiency: {
                type: 'number',
                description: 'Overall equipment efficiency as percentage',
              },
              qualityRate: {
                type: 'number',
                description: 'Quality rate as percentage',
              },
            },
          },
          trends: {
            type: 'object',
            properties: {
              dailyCompletions: {
                type: 'array',
                description: 'Daily completion counts for the last 30 days',
                items: {
                  type: 'object',
                  properties: {
                    date: {
                      type: 'string',
                      format: 'date',
                    },
                    completions: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
        },
      },
      DataCollectionActivity: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
            description: 'Activity name',
          },
          description: {
            type: 'string',
            description: 'Activity description',
          },
          fields: {
            type: 'array',
            description: 'Data collection fields',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                name: {
                  type: 'string',
                },
                label: {
                  type: 'string',
                },
                type: {
                  type: 'string',
                  enum: ['text', 'number', 'boolean', 'textarea', 'select', 'file', 'date', 'time'],
                },
                required: {
                  type: 'boolean',
                },
                validation: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
      FileUploadResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique file identifier',
          },
          filename: {
            type: 'string',
            description: 'Original filename',
          },
          size: {
            type: 'integer',
            description: 'File size in bytes',
          },
          contentType: {
            type: 'string',
            description: 'MIME type of the file',
          },
          attachmentType: {
            type: 'string',
            enum: ['work_instruction', 'quality_document', 'specification', 'photo', 'other'],
            description: 'Type of attachment',
          },
          url: {
            type: 'string',
            description: 'Download URL for the file',
          },
          uploadedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Upload timestamp',
          },
        },
      },
    },
  },
  paths: {
    '/orders': {
      post: {
        summary: 'Create a new order',
        description: 'Creates a new manufacturing order with the specified details. The order will be automatically assigned work order operations based on the routing.',
        tags: ['Orders'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateOrderRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Order created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Routing not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '409': {
            description: 'Duplicate order number',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      get: {
        summary: 'List orders',
        description: 'Retrieves a list of orders with optional filtering and pagination.',
        tags: ['Orders'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter by order status',
            schema: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            },
          },
          {
            name: 'fromDate',
            in: 'query',
            description: 'Filter orders created after this date (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'toDate',
            in: 'query',
            description: 'Filter orders created before this date (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'erpReference',
            in: 'query',
            description: 'Filter by ERP reference',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'productIdentifier',
            in: 'query',
            description: 'Filter by product identifier',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of orders to return',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 500,
              default: 50,
            },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of orders to skip',
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0,
            },
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Field to sort by',
            schema: {
              type: 'string',
              enum: ['createdAt', 'scheduledStartDate', 'priority'],
              default: 'createdAt',
            },
          },
          {
            name: 'order',
            in: 'query',
            description: 'Sort order',
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orders: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Order',
                      },
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of orders matching filters',
                    },
                    hasMore: {
                      type: 'boolean',
                      description: 'Whether there are more orders available',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/orders/{orderId}': {
      get: {
        summary: 'Get order details',
        description: 'Retrieves detailed information about a specific order, including all work order operations and their current status.',
        tags: ['Orders'],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            description: 'Order ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Order details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      patch: {
        summary: 'Update order',
        description: 'Updates specific fields of an order. Only provided fields will be updated.',
        tags: ['Orders'],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            description: 'Order ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateOrderRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/work-order-operations': {
      get: {
        summary: 'List work order operations',
        description: 'Retrieves a list of work order operations with optional filtering and pagination.',
        tags: ['Work Order Operations'],
        parameters: [
          {
            name: 'orderId',
            in: 'query',
            description: 'Filter by order ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by operation status',
            schema: {
              type: 'string',
              enum: ['pending', 'ready', 'in_progress', 'paused', 'completed'],
            },
          },
          {
            name: 'departmentId',
            in: 'query',
            description: 'Filter by department ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'operatorId',
            in: 'query',
            description: 'Filter by operator ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'fromDate',
            in: 'query',
            description: 'Filter operations started after this date (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'toDate',
            in: 'query',
            description: 'Filter operations started before this date (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of operations to return',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 500,
              default: 50,
            },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of operations to skip',
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0,
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of work order operations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    operations: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/WorkOrderOperation',
                      },
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of operations matching filters',
                    },
                    hasMore: {
                      type: 'boolean',
                      description: 'Whether there are more operations available',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/work-order-operations/{wooId}': {
      patch: {
        summary: 'Execute work order operation action',
        description: 'Performs an action on a work order operation (start, pause, resume, complete).',
        tags: ['Work Order Operations'],
        parameters: [
          {
            name: 'wooId',
            in: 'path',
            required: true,
            description: 'Work order operation ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/WorkOrderOperationAction',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Action executed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/WorkOrderOperation',
                },
              },
            },
          },
          '400': {
            description: 'Invalid action or missing required fields',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Work order operation not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/routings': {
      get: {
        summary: 'List routings',
        description: 'Retrieves a list of available routings with optional filtering.',
        tags: ['Routings'],
        parameters: [
          {
            name: 'active',
            in: 'query',
            description: 'Filter by active status',
            schema: {
              type: 'boolean',
            },
          },
          {
            name: 'productIdentifier',
            in: 'query',
            description: 'Filter by product identifier',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of routings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    routings: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Routing',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/routings/{routingId}': {
      get: {
        summary: 'Get routing details',
        description: 'Retrieves detailed information about a specific routing, including all operations and their requirements.',
        tags: ['Routings'],
        parameters: [
          {
            name: 'routingId',
            in: 'path',
            required: true,
            description: 'Routing ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Routing details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Routing',
                },
              },
            },
          },
          '404': {
            description: 'Routing not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/analytics/dashboard': {
      get: {
        summary: 'Get dashboard metrics',
        description: 'Retrieves key performance indicators and metrics for the main dashboard.',
        tags: ['Analytics'],
        parameters: [
          {
            name: 'fromDate',
            in: 'query',
            description: 'Start date for metrics calculation (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'toDate',
            in: 'query',
            description: 'End date for metrics calculation (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'departmentId',
            in: 'query',
            description: 'Filter metrics by department',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Dashboard metrics',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DashboardMetrics',
                },
              },
            },
          },
        },
      },
    },
    '/analytics/wip': {
      get: {
        summary: 'Get WIP analysis',
        description: 'Retrieves work-in-progress analysis including current WIP levels, bottlenecks, and trends.',
        tags: ['Analytics'],
        responses: {
          '200': {
            description: 'WIP analysis data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: {
                      type: 'object',
                      properties: {
                        totalWIP: {
                          type: 'integer',
                          description: 'Total work in progress count',
                        },
                        averageWIPAge: {
                          type: 'number',
                          description: 'Average WIP age in hours',
                        },
                      },
                    },
                    byDepartment: {
                      type: 'array',
                      description: 'WIP breakdown by department',
                      items: {
                        type: 'object',
                        properties: {
                          departmentId: {
                            type: 'string',
                            format: 'uuid',
                          },
                          departmentName: {
                            type: 'string',
                          },
                          wipCount: {
                            type: 'integer',
                          },
                          averageAge: {
                            type: 'number',
                          },
                        },
                      },
                    },
                    bottlenecks: {
                      type: 'array',
                      description: 'Identified bottlenecks',
                      items: {
                        type: 'object',
                        properties: {
                          departmentId: {
                            type: 'string',
                            format: 'uuid',
                          },
                          queueLength: {
                            type: 'integer',
                          },
                          averageWaitTime: {
                            type: 'number',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/analytics/performance': {
      get: {
        summary: 'Get performance metrics',
        description: 'Retrieves performance analytics including cycle times, throughput, and efficiency metrics.',
        tags: ['Analytics'],
        parameters: [
          {
            name: 'fromDate',
            in: 'query',
            description: 'Start date for analysis (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'toDate',
            in: 'query',
            description: 'End date for analysis (ISO 8601)',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'departmentId',
            in: 'query',
            description: 'Filter by department',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'operatorId',
            in: 'query',
            description: 'Filter by operator',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Performance metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cycleTime: {
                      type: 'object',
                      properties: {
                        average: {
                          type: 'number',
                          description: 'Average cycle time in hours',
                        },
                        median: {
                          type: 'number',
                          description: 'Median cycle time in hours',
                        },
                        p95: {
                          type: 'number',
                          description: '95th percentile cycle time in hours',
                        },
                      },
                    },
                    throughput: {
                      type: 'object',
                      properties: {
                        daily: {
                          type: 'number',
                          description: 'Average daily throughput',
                        },
                        weekly: {
                          type: 'number',
                          description: 'Average weekly throughput',
                        },
                      },
                    },
                    quality: {
                      type: 'object',
                      properties: {
                        firstPassYield: {
                          type: 'number',
                          description: 'First pass yield percentage',
                        },
                        reworkRate: {
                          type: 'number',
                          description: 'Rework rate percentage',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/data-collection': {
      post: {
        summary: 'Submit data collection',
        description: 'Submits collected data for a work order operation.',
        tags: ['Data Collection'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['workOrderOperationId', 'activityId', 'data'],
                properties: {
                  workOrderOperationId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Work order operation ID',
                  },
                  activityId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Data collection activity ID',
                  },
                  data: {
                    type: 'object',
                    description: 'Collected data values',
                  },
                  operatorId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Operator who collected the data',
                  },
                  notes: {
                    type: 'string',
                    description: 'Optional notes about the data collection',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Data collection submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                      description: 'Data collection record ID',
                    },
                    collectedAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Timestamp when data was collected',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid data or validation errors',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/data-collection/activities': {
      get: {
        summary: 'List data collection activities',
        description: 'Retrieves available data collection activities and their field definitions.',
        tags: ['Data Collection'],
        parameters: [
          {
            name: 'active',
            in: 'query',
            description: 'Filter by active status',
            schema: {
              type: 'boolean',
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of data collection activities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    activities: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/DataCollectionActivity',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/files/upload': {
      post: {
        summary: 'Upload file',
        description: 'Uploads a file and returns file information. Files can be attached to work order operations or used as reference documents.',
        tags: ['Files'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload',
                  },
                  attachmentType: {
                    type: 'string',
                    enum: ['work_instruction', 'quality_document', 'specification', 'photo', 'other'],
                    description: 'Type of attachment',
                  },
                  description: {
                    type: 'string',
                    description: 'File description',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'File uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FileUploadResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid file or file too large',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/files/download/{id}': {
      get: {
        summary: 'Download file',
        description: 'Downloads a previously uploaded file.',
        tags: ['Files'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'File ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'File content',
            content: {
              'application/octet-stream': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          '404': {
            description: 'File not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Orders',
      description: 'Manufacturing order management',
    },
    {
      name: 'Work Order Operations',
      description: 'Work order operation execution and tracking',
    },
    {
      name: 'Routings',
      description: 'Manufacturing routing definitions',
    },
    {
      name: 'Analytics',
      description: 'Performance metrics and analytics',
    },
    {
      name: 'Data Collection',
      description: 'Quality and process data collection',
    },
    {
      name: 'Files',
      description: 'File upload and download',
    },
  ],
}

export async function GET(request: NextRequest) {
  // Optional: Validate API authentication for documentation access
  // You may want to make this public or require authentication based on your needs

  const response = NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Add CORS headers for cross-origin access if needed
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-MES-Team-ID')

  return response
}

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MES-Team-ID',
    },
  })
}
