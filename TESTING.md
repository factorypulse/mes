# MES System - Automated Testing Guide

## Overview

This document provides comprehensive instructions for running the automated test suite for the Manufacturing Execution System (MES). The test suite covers all core functionality from authentication to complete operator workflows.

## Test Architecture

### Technology Stack
- **Framework**: Playwright Test
- **Language**: TypeScript
- **Browser Support**: Chrome, Firefox, Safari
- **Device Testing**: Desktop, Tablet, Mobile viewports

### Test Structure
```
tests/
├── global-setup.ts          # Global test configuration
├── global-teardown.ts       # Cleanup after all tests
├── utils/
│   ├── auth.ts              # Authentication helpers
│   └── test-data.ts         # Test data generators and API helpers
├── pages/
│   ├── operator-dashboard.ts # Operator dashboard page object
│   ├── routings-page.ts     # Routings management page object
│   └── orders-page.ts       # Orders management page object
├── fixtures/
│   └── test-data.json       # Static test data
└── *.spec.ts               # Test files
```

## Prerequisites

### 1. Install Dependencies
```bash
npm install
npx playwright install
```

### 2. Environment Setup
Ensure your `.env.local` file contains:
```env
# Stack Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
STACK_SECRET_SERVER_KEY=your_secret_key

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/mes_test"
```

### 3. Database Setup
```bash
npx prisma db push
npx prisma generate
```

### 4. Start Development Server
```bash
npm run dev
```
The tests expect the application to be running on `http://localhost:3000`.

## Test Credentials

The test suite uses the following credentials defined in `README.md`:
- **Email**: `tdarcytom@googlemail.com`
- **Password**: `y3m7Lw!f+:2jEDA`

These credentials are automatically used by the `AuthHelper` utility.

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Categories
```bash
# Authentication tests
npm run test:auth

# Routings management tests
npm run test:routings

# Operator workflow tests (most comprehensive)
npm run test:operator

# API endpoint tests
npm run test:api
```

### Interactive Mode
```bash
# Run tests with browser visible
npm run test:headed

# Run tests with interactive UI
npm run test:ui

# Debug mode (step through tests)
npm run test:debug
```

### View Test Reports
```bash
npm run test:report
```

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- ✅ **Login with valid credentials**
- ✅ **Error handling for invalid credentials**
- ✅ **Logout functionality**
- ✅ **Session timeout handling**
- ✅ **Redirect to intended page after login**
- ✅ **Team/organization switching**

### 2. Routings Management Tests (`routings.spec.ts`)
- ✅ **Create routing with multiple operations**
- ✅ **Edit existing routing details**
- ✅ **Archive routing**
- ✅ **Operations display in correct sequence**
- ✅ **Required field validation**
- ✅ **Data input schema configuration**

### 3. Operator Workflow Tests (`operator-workflow.spec.ts`)
**Most Critical Test Suite - Covers Core MES Functionality**

#### End-to-End Workflow
- ✅ **Complete production workflow** (Routing → Order → WOO → Data Capture → Completion)
- ✅ **Multi-operation routing execution**
- ✅ **Cross-organizational workflow handoff**

#### Work Order Operations
- ✅ **Start WOO from todo list**
- ✅ **Pause and resume with reason codes**
- ✅ **Complete with data capture**
- ✅ **Timer functionality verification**
- ✅ **Instructions display**

#### Data Validation
- ✅ **Required field validation before completion**
- ✅ **Dynamic form generation from schema**
- ✅ **Boolean, number, and text input types**

#### File Management
- ✅ **File attachment upload during operations**
- ✅ **Attachment descriptions and metadata**

#### Concurrency
- ✅ **Multiple operator access control**
- ✅ **WOO locking mechanisms**

#### Multi-Organization
- ✅ **Organization-specific work queues**
- ✅ **Workflow progression across departments**

### 4. API Tests (`api.spec.ts`)
**Backend Functionality Verification**

#### Orders API
- ✅ **Create order via API**
- ✅ **List orders with filtering**
- ✅ **Get specific order details**
- ✅ **Status filtering**

#### Work Order Operations API
- ✅ **Start WOO via API**
- ✅ **Pause/resume workflow**
- ✅ **Complete with captured data**
- ✅ **Organization filtering**

#### Pause Reasons API
- ✅ **CRUD operations**
- ✅ **Usage statistics**
- ✅ **Active/inactive filtering**

#### Routings API
- ✅ **Create routing with operations**
- ✅ **List and filter routings**
- ✅ **Archive functionality**

#### Error Handling
- ✅ **404 for non-existent resources**
- ✅ **400 for invalid data**
- ✅ **Concurrency conflict handling**

## Test Data Management

### Generated Test Data
The `TestDataGenerator` class creates unique test data for each test run:

```typescript
// Example usage
const routing = TestDataGenerator.createRouting({
  name: 'Custom Test Routing',
  operations: [...]
});

const order = TestDataGenerator.createOrder({
  productIdentifier: 'CUSTOM-001',
  quantity: 50
});
```

### API Helpers
The `APIHelper` class provides convenient methods for API interactions:

```typescript
// Example usage
const routingId = await apiHelper.createRouting(routing);
const orderId = await apiHelper.createOrder(order);
await apiHelper.startWOO(wooId);
await apiHelper.completeWOO(wooId, capturedData);
```

### Static Fixtures
Pre-defined test data is available in `tests/fixtures/test-data.json` for consistent testing scenarios.

## Page Object Models

### OperatorDashboardPage
- `startWOO(title)` - Start a work order operation
- `pauseActiveWOO(reason)` - Pause active operation with reason
- `resumePausedWOO(title)` - Resume paused operation
- `completeActiveWOO(data?)` - Complete with optional data
- `fillDataInputs(data)` - Fill form inputs
- `uploadAttachment(path, description?)` - Upload file

### RoutingsPage
- `createRouting(data)` - Create new routing
- `editRouting(name, updates)` - Update existing routing
- `archiveRouting(name)` - Archive routing
- `verifyRoutingExists(name)` - Check routing presence

### OrdersPage
- `createOrder(data)` - Create new order
- `filterByStatus(status)` - Filter order list
- `getOrderDetails(number)` - Get order information
- `searchOrders(term)` - Search functionality

## Browser Support

Tests run across multiple browsers and devices:

### Desktop Browsers
- ✅ **Chrome** (Latest)
- ✅ **Firefox** (Latest)
- ✅ **Safari** (Latest)

### Mobile/Tablet
- ✅ **Mobile Chrome** (Pixel 5)
- ✅ **Mobile Safari** (iPhone 12)
- ✅ **iPad Pro** (Operator interface optimized)

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Results and Reporting

### HTML Report
Interactive HTML report with:
- ✅ Test execution timeline
- ✅ Screenshots on failure
- ✅ Video recordings
- ✅ Network activity logs
- ✅ Console messages

### JUnit/JSON Reports
Machine-readable reports for CI/CD integration.

### Trace Viewer
Debug failed tests with:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## Debugging Failed Tests

### 1. Run in Headed Mode
```bash
npm run test:headed -- --grep "failing test name"
```

### 2. Use Debug Mode
```bash
npm run test:debug -- --grep "failing test name"
```

### 3. Check Screenshots
Failed tests automatically capture screenshots saved to `test-results/`.

### 4. Review Trace Files
Use Playwright's trace viewer to step through test execution.

## Performance Considerations

### Test Optimization
- ✅ **Parallel execution** where possible
- ✅ **API helpers** for fast data setup
- ✅ **Page object models** for maintainability
- ✅ **Selective test execution** for faster feedback

### Database Isolation
Each test uses unique data to prevent conflicts:
- Unique timestamps in test data
- Cleanup between test suites
- Transaction rollback where applicable

## UAT Test Coverage Mapping

This automated test suite implements all scenarios from `UAT_TESTS.md`:

| UAT Test | Automated Test | Status |
|----------|----------------|--------|
| UAT-R001-006 | `routings.spec.ts` | ✅ |
| UAT-O001-008 | `api.spec.ts` + UI tests | ✅ |
| UAT-W001-008 | `api.spec.ts` | ✅ |
| UAT-OP001-010 | `operator-workflow.spec.ts` | ✅ |
| UAT-P001-004 | Pause reason tests | ✅ |
| UAT-I001-005 | Cross-module integration | ✅ |
| UAT-S001-003 | Multi-browser testing | ✅ |

## Best Practices

### 1. Test Independence
- Each test creates its own data
- No dependencies between tests
- Clean state for each test run

### 2. Realistic Scenarios
- Tests mirror actual user workflows
- Comprehensive end-to-end coverage
- Real browser automation

### 3. Maintainability
- Page object models for UI changes
- Centralized test data generation
- Clear, descriptive test names

### 4. Reliability
- Robust element selectors
- Proper wait strategies
- Error handling and retries

## Troubleshooting

### Common Issues

#### 1. Authentication Failures
- Verify credentials in `README.md`
- Check Stack Auth configuration
- Ensure development server is running

#### 2. Database Connection Issues
- Verify `DATABASE_URL` in `.env.local`
- Run `npx prisma db push`
- Check database server status

#### 3. Timing Issues
- Tests include proper wait strategies
- Increase timeout if needed: `test.setTimeout(120000)`
- Check network conditions

#### 4. Element Not Found
- Verify UI hasn't changed
- Update selectors in page objects
- Check for loading states

### Getting Help

1. **Review test output** and error messages
2. **Check HTML report** for detailed failure information
3. **Run in debug mode** to step through failing tests
4. **Examine trace files** for detailed execution flow

## Contributing

### Adding New Tests
1. Create test file in appropriate category
2. Use existing page objects or create new ones
3. Follow naming conventions: `feature.spec.ts`
4. Include both positive and negative test cases

### Updating Page Objects
1. Keep selectors robust and maintainable
2. Add appropriate wait strategies
3. Include comprehensive JSDoc comments
4. Test across all supported browsers

This comprehensive test suite ensures the MES system works correctly across all core workflows and provides confidence for production deployment.
