# Functional Test Suite

This document describes the comprehensive functional test suite for the MES (Manufacturing Execution System) application. These tests focus on testing business logic, API endpoints, and integration workflows without browser automation.

## Overview

The functional tests are organized into three main categories:

1. **Service Layer Tests** (`tests-functional/services/`) - Unit tests for business logic
2. **API Endpoint Tests** (`tests-functional/api/`) - HTTP API integration tests
3. **Integration Tests** (`tests-functional/integration/`) - End-to-end workflow tests

## Test Framework

- **Framework**: Jest with TypeScript support
- **Mocking**: Jest mocks for Prisma database operations and external dependencies
- **Coverage**: Service layer business logic and API endpoints
- **Environment**: Node.js test environment (no browser required)

## Running Tests

### All Functional Tests
```bash
npm run test:functional
```

### Watch Mode (for development)
```bash
npm run test:functional:watch
```

### Coverage Report
```bash
npm run test:functional:coverage
```

### Specific Test Categories
```bash
# Service layer tests only
npm run test:services

# API endpoint tests only
npm run test:api-endpoints

# Integration workflow tests only
npm run test:integration
```

## Test Categories

### 1. Service Layer Tests

Tests the core business logic in isolation by mocking database operations.

#### `tests-functional/services/routings.service.test.ts`
- **Coverage**: RoutingsService business logic
- **Test Cases**:
  - Creating routings with and without operations
  - Retrieving routings by ID and team
  - Updating routing properties
  - Soft delete (deactivation) functionality
  - Adding/updating operations within routings
  - Error handling and edge cases

#### `tests-functional/services/orders.service.test.ts`
- **Coverage**: OrdersService business logic
- **Test Cases**:
  - Order creation with automatic WOO generation
  - Order lifecycle management (planned → in_progress → completed)
  - Date field handling and conversion
  - Order filtering by status and team
  - Order completion with WOO status updates
  - Soft delete (cancellation) functionality

### 2. API Endpoint Tests

Tests HTTP API routes including authentication, validation, and error handling.

#### `tests-functional/api/routings.api.test.ts`
- **Coverage**: `/api/routings` endpoints
- **Test Cases**:
  - GET requests with query parameters
  - POST requests for creating routings
  - Authentication verification (StackAuth mocking)
  - Team-based access control
  - Request validation and error responses
  - Service layer integration

### 3. Integration Tests

Tests complete end-to-end workflows that span multiple services and simulate real manufacturing scenarios.

#### `tests-functional/integration/mes-workflow.integration.test.ts`
- **Coverage**: Complete MES workflows
- **Test Scenarios**:

##### Complete Order Lifecycle
- Create routing with multiple operations (Assembly → Testing)
- Create order from routing (auto-generates WOOs)
- Start order (status: planned → in_progress)
- Execute operations sequentially:
  - Start first WOO (Assembly)
  - Complete with captured data (temperature, pressure)
  - Start second WOO (Testing)
  - Complete with quality results
- Complete entire order
- Verify final status and data integrity

##### Pause/Resume Workflow
- Create pause reasons (maintenance, quality issues)
- Start work order operation
- Pause operation with specific reason and notes
- Resume operation after maintenance
- Complete operation successfully
- Track pause duration and reasons

##### Multi-Department Workflow
- Create routing spanning 3 departments (Machining → Assembly → QC)
- Simulate different operators in each department
- Track data capture specific to each operation:
  - Machining: dimensions, surface finish
  - Assembly: torque settings, bolt counts
  - Testing: functional tests, defect tracking
- Handle quality issues (rejected units)
- Verify proper workflow progression

## Test Data and Mocking

### Prisma Mocking
All database operations are mocked using Jest mocks. The tests verify:
- Correct database queries are constructed
- Proper data transformations occur
- Business logic handles edge cases
- Error conditions are handled gracefully

### Mock Data Structure
Tests use realistic mock data that mirrors production data:
- Team-based multi-tenancy
- Hierarchical relationships (Routing → Operations → WOOs)
- Proper status transitions
- Realistic manufacturing data (quantities, times, measurements)

### Authentication Mocking
StackAuth is mocked to simulate:
- Authenticated users with team selection
- Unauthorized access attempts
- Missing team context scenarios

## Key Testing Patterns

### 1. Arrange-Act-Assert Pattern
```typescript
// Arrange: Set up mock data and expectations
const mockRouting = { id: 'routing-1', name: 'Test' }
prisma.mESRouting.create.mockResolvedValue(mockRouting)

// Act: Execute the function under test
const result = await RoutingsService.createRouting(input)

// Assert: Verify results and side effects
expect(result).toEqual(mockRouting)
expect(prisma.mESRouting.create).toHaveBeenCalledWith(expectedQuery)
```

### 2. Error Scenario Testing
```typescript
it('should handle database errors gracefully', async () => {
  prisma.mESRouting.findFirst.mockRejectedValue(new Error('DB connection failed'))

  const response = await GET(request)

  expect(response.status).toBe(500)
  expect(await response.json()).toEqual({ error: 'Internal server error' })
})
```

### 3. Workflow State Verification
```typescript
// Verify proper state transitions
expect(startedOrder.status).toBe('in_progress')
expect(startedOrder.actualStartDate).toBeDefined()

// Verify cascading updates
expect(completedOrder.workOrderOperations.every(woo =>
  woo.status === 'completed'
)).toBe(true)
```

## Coverage Goals

- **Service Layer**: 90%+ coverage of business logic
- **API Endpoints**: 100% coverage of HTTP routes
- **Integration**: Key manufacturing workflows covered
- **Error Handling**: All error paths tested
- **Edge Cases**: Boundary conditions and data validation

## Benefits of Functional Tests

1. **Fast Execution**: No browser startup, network calls, or UI rendering
2. **Reliable**: Not dependent on UI selectors or external authentication
3. **Comprehensive**: Tests business logic directly
4. **Maintainable**: Mock-based approach is easier to update
5. **CI/CD Friendly**: Can run in any environment without browser dependencies
6. **Debugging**: Easy to isolate and debug specific business logic issues

## Relationship to Other Tests

- **Playwright Tests**: Focus on UI interactions and user workflows
- **Functional Tests**: Focus on business logic and API functionality
- **Unit Tests**: Would focus on individual utility functions (future addition)

The functional tests complement the Playwright tests by providing:
- More reliable testing of core business logic
- Better coverage of edge cases and error conditions
- Faster feedback during development
- Testing of API endpoints that may not have UI coverage

## Running Both Test Suites

You can run both functional and Playwright tests:

```bash
# Run all tests (both functional and Playwright)
npm test && npm run test:functional

# In parallel (if you have enough resources)
npm run test:functional & npm test
```

This comprehensive approach ensures both the business logic and user experience are thoroughly tested.
