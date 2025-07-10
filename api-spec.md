# MES External API Specification v1.0

## Overview

The MES External API provides programmatic access to Manufacturing Execution System (MES) functionality for external integrations such as ERP systems, data collection systems, reporting tools, and equipment interfaces.

**Base URL**: `https://your-mes-domain.com/api/v1`

**API Version**: 1.0

**Multi-tenancy**: All API operations are scoped to a specific team/organization. Each API key is associated with a team and can only access data within that team's scope.

## Authentication

### API Key Authentication

All external API requests must include an API key in the request header:

```http
Authorization: Bearer <API_KEY>
X-MES-Team-ID: <TEAM_ID>
```

**API Key Management:**
- API keys are generated per team in the MES dashboard
- Keys can be scoped with specific permissions (read-only, read-write, admin)
- Keys can be revoked or regenerated at any time
- Rate limiting is applied per API key

### Team Scoping

Every API request requires a `X-MES-Team-ID` header that specifies which team's data to access. The API key must have permission to access the specified team.

## Rate Limiting

- **Rate Limit**: 1000 requests per hour per API key
- **Burst Limit**: 100 requests per minute per API key
- Rate limit headers are included in all responses:
  ```http
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1640995200
  ```

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid routing ID provided",
    "details": {
      "field": "routingId",
      "value": "invalid-id"
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists/concurrent modification)
- `422` - Unprocessable Entity (validation error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## API Endpoints

### 1. Orders Management

#### 1.1 Create Production Order

**Endpoint**: `POST /api/v1/orders`

**Description**: Creates a new production order in the MES system. This is the primary endpoint for ERP systems to initiate production.

**Request Body**:
```json
{
  "orderNumber": "ORD-2025-001", // Optional: system will generate if not provided
  "erpReference": "ERP-PO-12345", // Optional: external system reference
  "productIdentifier": "WIDGET-A-001",
  "quantity": 100,
  "routingId": "routing-uuid-123", // Required: must exist in team
  "routingName": "Widget Assembly v1.0", // Alternative to routingId
  "priority": 1, // 1-5, default 1
  "scheduledStartDate": "2025-01-20T08:00:00Z", // Optional
  "scheduledEndDate": "2025-01-22T17:00:00Z", // Optional
  "notes": "Rush order for customer ABC",
  "customFields": { // Optional: additional metadata
    "customerPO": "CUST-12345",
    "projectCode": "PROJ-001"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "order-uuid-456",
  "orderNumber": "ORD-2025-001",
  "erpReference": "ERP-PO-12345",
  "productIdentifier": "WIDGET-A-001",
  "quantity": 100,
  "routingId": "routing-uuid-123",
  "priority": 1,
  "status": "pending",
  "scheduledStartDate": "2025-01-20T08:00:00Z",
  "scheduledEndDate": "2025-01-22T17:00:00Z",
  "notes": "Rush order for customer ABC",
  "customFields": {
    "customerPO": "CUST-12345",
    "projectCode": "PROJ-001"
  },
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "workOrderOperations": [
    {
      "id": "woo-uuid-789",
      "operationNumber": 1,
      "operationName": "Assembly Station 1",
      "status": "pending",
      "departmentId": "dept-uuid-111"
    }
  ]
}
```

#### 1.2 Get Orders

**Endpoint**: `GET /api/v1/orders`

**Query Parameters**:
- `status` - Filter by status: `pending`, `in_progress`, `completed`, `cancelled`
- `fromDate` - ISO date string (inclusive)
- `toDate` - ISO date string (inclusive)
- `erpReference` - Filter by ERP reference
- `productIdentifier` - Filter by product
- `limit` - Max results (default: 50, max: 500)
- `offset` - Pagination offset
- `sort` - Sort field: `createdAt`, `scheduledStartDate`, `priority`
- `order` - Sort order: `asc`, `desc`

**Response** (200 OK):
```json
{
  "orders": [
    {
      "id": "order-uuid-456",
      "orderNumber": "ORD-2025-001",
      "erpReference": "ERP-PO-12345",
      "productIdentifier": "WIDGET-A-001",
      "quantity": 100,
      "status": "in_progress",
      "priority": 1,
      "scheduledStartDate": "2025-01-20T08:00:00Z",
      "actualStartDate": "2025-01-20T08:15:00Z",
      "currentOperation": {
        "id": "woo-uuid-789",
        "operationNumber": 2,
        "operationName": "Quality Check",
        "status": "in_progress"
      },
      "progress": {
        "completedOperations": 1,
        "totalOperations": 4,
        "percentComplete": 25
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 1.3 Get Order Details

**Endpoint**: `GET /api/v1/orders/{orderId}`

**Response** (200 OK):
```json
{
  "id": "order-uuid-456",
  "orderNumber": "ORD-2025-001",
  "erpReference": "ERP-PO-12345",
  "productIdentifier": "WIDGET-A-001",
  "quantity": 100,
  "status": "in_progress",
  "priority": 1,
  "scheduledStartDate": "2025-01-20T08:00:00Z",
  "actualStartDate": "2025-01-20T08:15:00Z",
  "routing": {
    "id": "routing-uuid-123",
    "name": "Widget Assembly v1.0",
    "version": "1.0"
  },
  "workOrderOperations": [
    {
      "id": "woo-uuid-789",
      "operationNumber": 1,
      "operationName": "Assembly Station 1",
      "department": {
        "id": "dept-uuid-111",
        "name": "Assembly"
      },
      "status": "completed",
      "actualStartTime": "2025-01-20T08:15:00Z",
      "actualEndTime": "2025-01-20T09:45:00Z",
      "operatorId": "user-uuid-222",
      "quantityCompleted": 100,
      "capturedData": {
        "torqueReading": 45.2,
        "qualityCheck": true
      }
    }
  ],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-20T09:45:00Z"
}
```

#### 1.4 Update Order Status

**Endpoint**: `PATCH /api/v1/orders/{orderId}`

**Request Body**:
```json
{
  "status": "cancelled", // pending, in_progress, on_hold, completed, cancelled
  "notes": "Customer cancellation request",
  "priority": 5 // Optional: update priority
}
```

### 2. Work Order Operations (WOO)

#### 2.1 Get Work Order Operations

**Endpoint**: `GET /api/v1/work-order-operations`

**Query Parameters**:
- `orderId` - Filter by order ID
- `status` - Filter by status: `pending`, `in_progress`, `paused`, `completed`, `waiting`
- `departmentId` - Filter by department
- `operatorId` - Filter by operator
- `fromDate` - Start date filter
- `toDate` - End date filter
- `limit` - Max results (default: 50, max: 500)
- `offset` - Pagination offset

**Response** (200 OK):
```json
{
  "workOrderOperations": [
    {
      "id": "woo-uuid-789",
      "orderId": "order-uuid-456",
      "orderNumber": "ORD-2025-001",
      "operationNumber": 1,
      "operationName": "Assembly Station 1",
      "department": {
        "id": "dept-uuid-111",
        "name": "Assembly"
      },
      "status": "in_progress",
      "operatorId": "user-uuid-222",
      "scheduledStartTime": "2025-01-20T08:00:00Z",
      "actualStartTime": "2025-01-20T08:15:00Z",
      "targetTimeSeconds": 3600,
      "elapsedTimeSeconds": 2700,
      "quantityCompleted": 75,
      "quantityTarget": 100
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### 2.2 Update Work Order Operation

**Endpoint**: `PATCH /api/v1/work-order-operations/{wooId}`

**Request Body**:
```json
{
  "action": "start", // start, pause, resume, complete
  "operatorId": "user-uuid-222", // Required for start
  "pauseReasonId": "pause-reason-uuid", // Required for pause
  "capturedData": { // Optional for complete
    "torqueReading": 45.2,
    "qualityCheck": true,
    "notes": "Operation completed successfully"
  },
  "quantityCompleted": 100, // Optional for complete
  "quantityRejected": 0 // Optional for complete
}
```

**Response** (200 OK):
```json
{
  "id": "woo-uuid-789",
  "status": "completed",
  "actualStartTime": "2025-01-20T08:15:00Z",
  "actualEndTime": "2025-01-20T09:45:00Z",
  "totalActiveTimeSeconds": 5400,
  "operatorId": "user-uuid-222",
  "quantityCompleted": 100,
  "capturedData": {
    "torqueReading": 45.2,
    "qualityCheck": true,
    "notes": "Operation completed successfully"
  },
  "updatedAt": "2025-01-20T09:45:00Z"
}
```

### 3. Routings

#### 3.1 Get Routings

**Endpoint**: `GET /api/v1/routings`

**Query Parameters**:
- `activeOnly` - Boolean, default true
- `productIdentifier` - Filter by product
- `limit` - Max results
- `offset` - Pagination offset

**Response** (200 OK):
```json
{
  "routings": [
    {
      "id": "routing-uuid-123",
      "name": "Widget Assembly v1.0",
      "description": "Standard widget assembly process",
      "version": "1.0",
      "isActive": true,
      "operationsCount": 4,
      "estimatedCycleTimeSeconds": 14400,
      "createdAt": "2025-01-10T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### 3.2 Get Routing Details

**Endpoint**: `GET /api/v1/routings/{routingId}`

**Response** (200 OK):
```json
{
  "id": "routing-uuid-123",
  "name": "Widget Assembly v1.0",
  "description": "Standard widget assembly process",
  "version": "1.0",
  "isActive": true,
  "operations": [
    {
      "id": "op-uuid-111",
      "operationNumber": 1,
      "operationName": "Assembly Station 1",
      "department": {
        "id": "dept-uuid-111",
        "name": "Assembly"
      },
      "setupTimeMinutes": 15,
      "runTimeMinutes": 45,
      "instructions": "Assemble components A and B using fixture F1",
      "requiredSkills": ["assembly", "quality_check"],
      "dataCollectionActivities": [
        {
          "id": "dca-uuid-111",
          "name": "Torque Measurement",
          "isRequired": true,
          "sequence": 1
        }
      ]
    }
  ],
  "createdAt": "2025-01-10T09:00:00Z",
  "updatedAt": "2025-01-12T14:30:00Z"
}
```

### 4. Data Collection

#### 4.1 Submit Data Collection

**Endpoint**: `POST /api/v1/data-collection`

**Description**: Submit data collected during a work order operation.

**Request Body**:
```json
{
  "workOrderOperationId": "woo-uuid-789",
  "dataCollectionActivityId": "dca-uuid-111",
  "operatorId": "user-uuid-222",
  "collectedData": {
    "torqueReading": 45.2,
    "visualInspection": "pass",
    "notes": "All measurements within tolerance"
  },
  "timestamp": "2025-01-20T09:30:00Z" // Optional, defaults to now
}
```

**Response** (201 Created):
```json
{
  "id": "dc-uuid-333",
  "workOrderOperationId": "woo-uuid-789",
  "dataCollectionActivityId": "dca-uuid-111",
  "operatorId": "user-uuid-222",
  "collectedData": {
    "torqueReading": 45.2,
    "visualInspection": "pass",
    "notes": "All measurements within tolerance"
  },
  "collectedAt": "2025-01-20T09:30:00Z"
}
```

#### 4.2 Get Data Collection Activities

**Endpoint**: `GET /api/v1/data-collection/activities`

**Response** (200 OK):
```json
{
  "activities": [
    {
      "id": "dca-uuid-111",
      "name": "Torque Measurement",
      "description": "Measure and record torque values",
      "fields": [
        {
          "id": "field-uuid-111",
          "name": "torqueReading",
          "label": "Torque Reading (Nm)",
          "type": "number",
          "required": true,
          "validation": {
            "min": 40,
            "max": 50
          }
        }
      ],
      "isActive": true
    }
  ]
}
```

### 5. Analytics & Reporting

#### 5.1 Get Dashboard Metrics

**Endpoint**: `GET /api/v1/analytics/dashboard`

**Query Parameters**:
- `fromDate` - Start date for metrics calculation
- `toDate` - End date for metrics calculation
- `departmentId` - Filter by department

**Response** (200 OK):
```json
{
  "metrics": {
    "ordersInProgress": 12,
    "operationsInProgress": 24,
    "completedOperationsToday": 156,
    "averageCycleTimeSeconds": 3420,
    "onTimeDeliveryRate": 0.94,
    "operatorUtilization": 0.87
  },
  "trends": {
    "dailyCompletions": [
      {
        "date": "2025-01-20",
        "completed": 156
      }
    ]
  },
  "calculatedAt": "2025-01-20T15:30:00Z"
}
```

#### 5.2 Get WIP (Work In Progress) Data

**Endpoint**: `GET /api/v1/analytics/wip`

**Response** (200 OK):
```json
{
  "summary": {
    "totalWipOperations": 45,
    "wipByStatus": {
      "pending": 12,
      "in_progress": 18,
      "paused": 3,
      "waiting": 12
    }
  },
  "wipByDepartment": [
    {
      "departmentId": "dept-uuid-111",
      "departmentName": "Assembly",
      "pendingOperations": 5,
      "inProgressOperations": 8,
      "pausedOperations": 1
    }
  ],
  "bottlenecks": [
    {
      "departmentId": "dept-uuid-222",
      "departmentName": "Quality Control",
      "queueSize": 15,
      "averageWaitTime": 7200
    }
  ]
}
```

#### 5.3 Get Performance Metrics

**Endpoint**: `GET /api/v1/analytics/performance`

**Query Parameters**:
- `fromDate` - Start date
- `toDate` - End date
- `departmentId` - Filter by department
- `operatorId` - Filter by operator

**Response** (200 OK):
```json
{
  "cycleTimeAnalysis": {
    "averageCycleTimeSeconds": 3420,
    "targetCycleTimeSeconds": 3600,
    "efficiency": 1.05,
    "cycleTimeByDepartment": [
      {
        "departmentId": "dept-uuid-111",
        "departmentName": "Assembly",
        "averageCycleTime": 2880,
        "targetCycleTime": 3000,
        "efficiency": 1.04
      }
    ]
  },
  "throughput": {
    "operationsPerHour": 16.5,
    "throughputTrend": [
      {
        "hour": "2025-01-20T08:00:00Z",
        "operationsCompleted": 18
      }
    ]
  },
  "qualityMetrics": {
    "completionRate": 0.98,
    "reworkRate": 0.02,
    "defectRate": 0.001
  }
}
```

<!-- ### 6. Equipment Integration

#### 6.1 Update Equipment Status

**Endpoint**: `POST /api/v1/equipment/status`

**Description**: Allow equipment to report status and data to the MES system.

**Request Body**:
```json
{
  "equipmentId": "MACHINE-001",
  "departmentId": "dept-uuid-111",
  "status": "running", // running, idle, down, maintenance
  "workOrderOperationId": "woo-uuid-789", // Optional: if equipment is working on specific WOO
  "data": {
    "temperature": 85.5,
    "pressure": 12.3,
    "cycleCount": 1245,
    "lastCycleTime": 120.5
  },
  "alarms": [
    {
      "code": "TEMP_HIGH",
      "severity": "warning",
      "message": "Temperature approaching upper limit"
    }
  ],
  "timestamp": "2025-01-20T10:15:00Z"
}
```

**Response** (200 OK):
```json
{
  "acknowledged": true,
  "equipmentId": "MACHINE-001",
  "status": "running",
  "receivedAt": "2025-01-20T10:15:00Z",
  "actions": [
    {
      "type": "alert",
      "message": "Temperature monitoring enabled"
    }
  ]
}
``` -->

### 7. File Attachments

#### 7.1 Upload File

**Endpoint**: `POST /api/v1/files/upload`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file` - The file to upload
- `workOrderOperationId` - Optional: Associate with WOO
- `routingOperationId` - Optional: Associate with routing operation
- `attachmentType` - Type: `instruction`, `drawing`, `photo`, `document`
- `description` - Optional file description

**Response** (201 Created):
```json
{
  "id": "file-uuid-444",
  "filename": "assembly_instruction.pdf",
  "originalFilename": "Assembly Instructions v2.pdf",
  "mimeType": "application/pdf",
  "size": 2048576,
  "attachmentType": "instruction",
  "workOrderOperationId": "woo-uuid-789",
  "uploadedAt": "2025-01-20T11:00:00Z",
  "downloadUrl": "/api/v1/files/download/file-uuid-444"
}
```


## Webhooks

### Webhook Configuration

Webhooks allow real-time notifications when events occur in the MES system.

**Configuration**: Set webhook URLs in the MES dashboard under API settings.

### Event Types

#### Order Events
- `order.created` - New order created
- `order.started` - Order production started
- `order.completed` - Order completed
- `order.cancelled` - Order cancelled

#### Work Order Operation Events
- `woo.started` - Operation started
- `woo.paused` - Operation paused
- `woo.resumed` - Operation resumed
- `woo.completed` - Operation completed

#### Equipment Events
- `equipment.alarm` - Equipment alarm triggered
- `equipment.status_changed` - Equipment status changed

### Webhook Payload Format

```json
{
  "event": "order.completed",
  "timestamp": "2025-01-20T16:30:00Z",
  "teamId": "team-uuid-123",
  "data": {
    "orderId": "order-uuid-456",
    "orderNumber": "ORD-2025-001",
    "completedAt": "2025-01-20T16:30:00Z",
    "totalCycleTimeSeconds": 14580,
    "quantityCompleted": 100
  },
  "webhookId": "webhook-uuid-789"
}
```

## API Versioning

- Current version: `v1`
- Version is specified in the URL path: `/api/v1/`
- Backwards compatibility maintained for at least 12 months
- Deprecation notices provided 6 months in advance
- New versions support parallel operation with previous versions

## Security Considerations

1. **API Key Security**:
   - Keys should be stored securely and rotated regularly
   - Use HTTPS for all API communications
   - Keys can be restricted by IP address if needed

2. **Data Privacy**:
   - All data is scoped to the team associated with the API key
   - No cross-team data access possible
   - Audit logging for all API operations

3. **Input Validation**:
   - All input data is validated against schemas
   - SQL injection and XSS protection
   - File upload restrictions and scanning

4. **Rate Limiting**:
   - Per-key rate limiting prevents abuse
   - Burst limits for short-term spikes
   - Graceful degradation under load

## Implementation Checklist

### Phase 5 Implementation Tasks:

1. **API Authentication & Authorization**:
   - [ ] Create API key generation system
   - [ ] Implement bearer token authentication middleware
   - [ ] Add team-scoped authorization
   - [ ] Implement rate limiting
   - [ ] Add audit logging

2. **External API Endpoints**:
   - [ ] Orders API (`/api/v1/orders`)
   - [ ] Work Order Operations API (`/api/v1/work-order-operations`)
   - [ ] Routings API (`/api/v1/routings`)
   - [ ] Data Collection API (`/api/v1/data-collection`)
   - [ ] Analytics API (`/api/v1/analytics`)
   - [ ] Equipment API (`/api/v1/equipment`)
   - [ ] Files API (`/api/v1/files`)

3. **API Documentation**:
   - [ ] OpenAPI/Swagger specification
   - [ ] Interactive API documentation
   <!-- - [ ] SDK generation (optional) -->
   - [ ] API usage examples

4. **Webhooks System**:
   - [ ] Webhook configuration management
   - [ ] Event publishing system
   - [ ] Reliable delivery with retries
   - [ ] Webhook verification

5. **Testing & Monitoring**:
   - [ ] API endpoint tests
   - [ ] Load testing
   - [ ] API metrics and monitoring
   - [ ] Error tracking and alerting

This specification provides a comprehensive foundation for external system integrations while maintaining the security and multi-tenancy requirements of the MES system.
