# User Acceptance Testing (UAT) - MES System
**Version**: 1.0
**Last Updated**: January 15, 2025
**Based on**: spec.md v1.0

## Test Environment Setup
- **Database**: Clean PostgreSQL instance with schema applied
- **Authentication**: StackAuth configured with test accounts
- **Test Data**: Minimal seed data (1 account, 2 orgs, 2 users per role)
- **Browser**: Chrome/Firefox latest versions
- **Device**: Desktop and tablet testing required

## Test User Roles
- **Admin**: Full system access
- **Planner**: Production planning and order management
- **Operator**: Shop floor operations and data capture

---

## Module 1: Routings Management

### UAT-R001: Create New Routing
**Role**: Admin/Planner
**Preconditions**: User logged in with appropriate permissions

**Test Steps**:
1. Navigate to Routings Management page
2. Click "Create New Routing" button
3. Fill in routing details:
   - Name: "Standard Widget Assembly"
   - Product Identifier: "WIDGET-001"
   - Set as Active: true
4. Click "Save Routing"

**Expected Results**:
- Routing is created successfully
- User is redirected to routing details page
- New routing appears in routings list
- System generates unique ID and timestamps

### UAT-R002: Add Operations to Routing
**Role**: Admin/Planner
**Preconditions**: Routing created (UAT-R001)

**Test Steps**:
1. Open routing details page
2. Click "Add Operation" button
3. Fill operation details:
   - Sequence: 1
   - Title: "Initial Assembly"
   - Department: Select from dropdown
   - Target Time: 30 minutes (1800 seconds)
   - Instructions: "Assemble main components according to drawing A-101"
4. Add data input schema:
   - Add "measurement_a" (number field)
   - Add "qc_passed" (boolean field)
5. Upload attachment (PDF instruction document)
6. Save operation
7. Repeat for second operation (sequence 2)

**Expected Results**:
- Operations are saved with correct sequence
- Data input schema is properly formatted
- Attachments are uploaded and accessible
- Operations display in correct order

### UAT-R003: Edit Existing Routing
**Role**: Admin/Planner
**Preconditions**: Routing with operations exists

**Test Steps**:
1. Navigate to routing details
2. Click "Edit Routing" button
3. Modify routing name
4. Edit operation details (change target time)
5. Add new operation between existing ones
6. Save changes

**Expected Results**:
- Changes are saved successfully
- Sequence numbers are updated correctly
- Modified data is reflected in the UI
- Audit trail shows update timestamp

### UAT-R004: Archive/Deactivate Routing
**Role**: Admin/Planner
**Preconditions**: Active routing exists

**Test Steps**:
1. Open routing details
2. Click "Archive Routing" button
3. Confirm archive action

**Expected Results**:
- Routing status changes to inactive
- Routing removed from active routings list
- Can still view archived routing
- Cannot create new orders with archived routing

---

## Module 2: Order Management

### UAT-O001: Create Manual Production Order
**Role**: Planner
**Preconditions**: Active routing exists

**Test Steps**:
1. Navigate to Order Management page
2. Click "Create New Order" button
3. Fill order details:
   - Product Identifier: "WIDGET-001"
   - Quantity: 50
   - Routing: Select from dropdown
   - Launch Date: Tomorrow's date
   - Due Date: Next week
   - ERP Reference: "ERP-12345" (optional)
4. Click "Create Order"

**Expected Results**:
- Order created with system-generated order number
- Status set to "Pending"
- WOOs automatically generated based on routing
- Order appears in orders list

### UAT-O002: View Orders List with Filtering
**Role**: Planner
**Preconditions**: Multiple orders exist with different statuses

**Test Steps**:
1. Navigate to Orders page
2. Test filter by status:
   - Filter by "Pending" - verify only pending orders show
   - Filter by "In Progress" - verify only active orders show
   - Filter by "Completed" - verify only completed orders show
3. Test date filtering:
   - Filter by "Launching Today"
   - Filter by "Launching This Week"
   - Filter by custom date range
4. Test sorting:
   - Sort by creation date
   - Sort by launch date
   - Sort by due date

**Expected Results**:
- Filters work correctly and show appropriate orders
- Sorting functions properly
- Order counts are accurate
- UI updates responsively

### UAT-O003: View Order Details
**Role**: Planner
**Preconditions**: Order with WOOs exists

**Test Steps**:
1. Click on order from orders list
2. Review order details page

**Expected Results**:
- All order information displayed correctly
- Current WOO is highlighted
- Progress through routing is visible
- WOO status and timing information shown
- Related routing information accessible

### UAT-O004: API Order Creation
**Role**: System/External API
**Preconditions**: API authentication configured

**Test Steps**:
1. Send POST request to `/api/v1/mes_orders` with:
   ```json
   {
     "product_identifier": "WIDGET-002",
     "quantity": 25,
     "mes_routing_id": "routing-uuid",
     "launch_date": "2025-01-20",
     "erp_production_order_reference": "ERP-67890"
   }
   ```

**Expected Results**:
- Order created successfully (201 response)
- System-generated order number returned
- WOOs automatically generated
- Order appears in UI immediately

---

## Module 3: Work Order Operations (WOO) Management

### UAT-W001: Automatic WOO Generation
**Role**: System
**Preconditions**: Order created with routing

**Test Steps**:
1. Create new order (UAT-O001)
2. Verify WOO generation

**Expected Results**:
- WOOs created for each routing operation
- Correct sequence numbers assigned
- First WOO status set to "To Do"
- Subsequent WOOs status set to "To Do"
- Order's current_mes_work_order_operation_id points to first WOO
- All routing data copied correctly (title, instructions, schema, etc.)

### UAT-W002: WOO Status Progression
**Role**: System
**Preconditions**: Order with multiple WOOs exists

**Test Steps**:
1. Complete first WOO
2. Verify automatic progression

**Expected Results**:
- Completed WOO status changes to "Completed"
- Next WOO status changes to "To Do"
- Order's current_mes_work_order_operation_id updates
- If last WOO completed, order status changes to "Completed"

---

## Module 4: Operator Workflow & Data Capture

### UAT-OP001: Operator Dashboard View
**Role**: Operator
**Preconditions**: WOOs assigned to operator's org exist

**Test Steps**:
1. Login as operator
2. View operator dashboard

**Expected Results**:
- Dashboard shows WOOs assigned to operator's org
- Only "To Do" and "Paused" WOOs displayed
- WOOs ordered by launch_date then sequence_number
- Each WOO shows order info, operation title, and status

### UAT-OP002: Start Work Order Operation
**Role**: Operator
**Preconditions**: "To Do" WOO available

**Test Steps**:
1. Select WOO from dashboard
2. Click "Start" button
3. Confirm start action

**Expected Results**:
- WOO status changes to "In Progress"
- actual_start_time recorded
- Timer begins in UI
- WOO removed from "To Do" list
- Instructions and attachments visible

### UAT-OP003: View WOO Instructions and Attachments
**Role**: Operator
**Preconditions**: WOO started with attachments

**Test Steps**:
1. Open active WOO
2. Review instructions section
3. View attached documents

**Expected Results**:
- Instructions displayed clearly
- PDF attachments display inline
- Image attachments display inline
- Documents are readable and accessible

### UAT-OP004: Pause Work Order Operation
**Role**: Operator
**Preconditions**: WOO in "In Progress" status

**Test Steps**:
1. Click "Pause" button on active WOO
2. Select pause reason from dropdown
3. Confirm pause

**Expected Results**:
- Pause reason dialog appears
- Only active pause reasons shown
- WOO status changes to "Paused"
- Pause event recorded with start_time
- Timer stops in UI
- WOO appears in "Paused" section of dashboard

### UAT-OP005: Resume Paused WOO
**Role**: Operator
**Preconditions**: Paused WOO exists

**Test Steps**:
1. Select paused WOO from dashboard
2. Click "Resume" button

**Expected Results**:
- WOO status changes to "In Progress"
- Pause event end_time and duration recorded
- Timer resumes in UI
- WOO moves to active section

### UAT-OP006: Data Input and Capture
**Role**: Operator
**Preconditions**: WOO with data_input_schema in progress

**Test Steps**:
1. Open active WOO with data inputs
2. Fill in required data fields:
   - Number field: Enter measurement
   - Boolean field: Check QC status
   - Text field: Enter notes
3. Validate data entry

**Expected Results**:
- Form displays based on data_input_schema
- Field validation works correctly
- Data is temporarily stored
- Required fields are marked
- Field types render correctly (number, boolean, text)

### UAT-OP007: Upload Operator Attachments
**Role**: Operator
**Preconditions**: WOO in progress

**Test Steps**:
1. Click "Add Attachment" button
2. Select file (image/document)
3. Upload file
4. Add description/notes

**Expected Results**:
- File uploads successfully
- Progress indicator shown during upload
- Uploaded file appears in attachments list
- File is accessible and viewable

### UAT-OP008: Complete Work Order Operation
**Role**: Operator
**Preconditions**: WOO in progress with data entered

**Test Steps**:
1. Fill all required data fields
2. Click "Complete" button
3. Confirm completion

**Expected Results**:
- Data validation passes
- actual_end_time recorded
- total_active_time_seconds calculated (excluding pause time)
- captured_data saved to database
- WOO status changes to "Completed"
- User redirected to dashboard
- Next WOO becomes available (if same org) or appears on appropriate dashboard

### UAT-OP009: Complete Final WOO in Order
**Role**: Operator
**Preconditions**: Last WOO in order sequence

**Test Steps**:
1. Complete final WOO in routing sequence
2. Verify order completion

**Expected Results**:
- WOO completed successfully
- Parent order status changes to "Completed"
- Order completed_at timestamp set
- Order appears in completed orders list
- No further WOOs remain for order

### UAT-OP010: Multi-Org Workflow
**Role**: Multiple Operators
**Preconditions**: Routing with operations for different orgs

**Test Steps**:
1. Operator A completes WOO for Org 1
2. Verify WOO appears for Operator B (Org 2)
3. Operator B completes their WOO
4. Verify progression continues

**Expected Results**:
- WOO properly transfers between org dashboards
- Only appropriate operators see relevant WOOs
- Workflow continues seamlessly across departments

---

## Module 5: Pause Reason Management

### UAT-P001: Create Pause Reasons
**Role**: Admin
**Preconditions**: Admin access to system

**Test Steps**:
1. Navigate to Pause Reason Management
2. Click "Add Pause Reason"
3. Enter details:
   - Reason Code: "MACH_DOWN"
   - Description: "Machine Breakdown"
   - Status: Active
4. Save pause reason
5. Create multiple additional reasons

**Expected Results**:
- Pause reasons created successfully
- Unique reason codes enforced within account
- Pause reasons appear in dropdown lists
- Active/inactive status respected

### UAT-P002: Edit Pause Reasons
**Role**: Admin
**Preconditions**: Pause reasons exist

**Test Steps**:
1. Select existing pause reason
2. Modify description
3. Change active status
4. Save changes

**Expected Results**:
- Changes saved successfully
- Inactive reasons don't appear in operator dropdowns
- Active reasons available for selection
- Audit trail maintained

### UAT-P003: Pause Reason Usage in Operations
**Role**: Operator
**Preconditions**: Active pause reasons exist, WOO in progress

**Test Steps**:
1. Pause active WOO
2. Verify pause reason dropdown shows only active reasons
3. Select pause reason
4. Verify pause reason recorded correctly

**Expected Results**:
- Only active pause reasons displayed
- Reason code and description shown clearly
- Selected reason stored in pause_events
- Reason text stored for historical reference

---

## Module 6: Reporting & Analytics

### UAT-R001: Current WIP Dashboard
**Role**: Planner/Manager
**Preconditions**: Orders and WOOs in various states exist

**Test Steps**:
1. Navigate to Reports section
2. Open WIP Dashboard
3. Review metrics and displays

**Expected Results**:
- Order count by status displays correctly
- "In Progress" orders listed with current WOO info
- "On Hold" orders shown separately
- Real-time data updates
- Assigned org information visible

### UAT-R002: Cycle Time Report
**Role**: Planner/Manager
**Preconditions**: Completed WOOs exist with timing data

**Test Steps**:
1. Open Cycle Time Report
2. Apply filters:
   - Date range filter
   - Routing filter
3. Review report data

**Expected Results**:
- Average, min, max times displayed per operation
- Comparison against target times shown
- Data filterable by date and routing
- Charts/visualizations load correctly
- Export functionality works

### UAT-R003: Hold/Pause Analysis Report
**Role**: Planner/Manager
**Preconditions**: WOOs with pause events exist

**Test Steps**:
1. Open Pause Analysis Report
2. Apply filters:
   - Date range
   - Organization
3. Review pause data

**Expected Results**:
- Total pause time by reason displayed
- Frequency of each pause reason shown
- Data grouped correctly
- Charts show trends
- Filterable by date and org

### UAT-R004: Schedule Adherence View
**Role**: Planner/Manager
**Preconditions**: Orders with various launch dates exist

**Test Steps**:
1. Open Schedule Adherence report
2. Filter by:
   - "Launching Today"
   - "Launching This Week"
   - "Overdue Launch"
3. Review order status vs. schedule

**Expected Results**:
- Orders correctly categorized by launch date
- Current status shown for each order
- Overdue orders highlighted
- Adherence metrics calculated
- Actionable insights provided

---

## Cross-Module Integration Tests

### UAT-I001: End-to-End Order Processing
**Role**: Multiple users
**Preconditions**: Clean system with routing defined

**Test Steps**:
1. Admin creates routing with 3 operations across 2 orgs
2. Planner creates order with this routing
3. Operator 1 (Org A) starts and completes first WOO
4. Operator 2 (Org B) processes second WOO
5. Operator 1 (Org A) completes final WOO
6. Manager reviews completed order in reports

**Expected Results**:
- Complete workflow executes smoothly
- Data integrity maintained throughout
- Timing and progress tracking accurate
- Reports reflect completed order correctly

### UAT-I002: Multi-Tenant Data Isolation
**Role**: Multiple accounts
**Preconditions**: Two separate accounts configured

**Test Steps**:
1. Create data in Account A
2. Login to Account B
3. Verify no cross-account data visibility
4. Create similar data in Account B
5. Switch back to Account A
6. Verify Account A data unchanged and isolated

**Expected Results**:
- Complete data isolation between accounts
- No data leakage or cross-contamination
- Performance not impacted by other accounts
- User can only access their account's data

### UAT-I003: Performance Under Load
**Role**: System
**Preconditions**: Sufficient test data loaded

**Test Steps**:
1. Create 100 orders with 5 operations each
2. Have 10 operators working simultaneously
3. Monitor response times for:
   - Starting WOOs
   - Completing WOOs
   - Dashboard refresh
   - Report generation

**Expected Results**:
- Sub-second response times for operator actions
- Dashboard updates within 2 seconds
- Reports load within 10 seconds
- No errors or timeouts under normal load

---

## Device and Browser Compatibility

### UAT-C001: Tablet Compatibility
**Role**: Operator
**Preconditions**: System accessible on tablet

**Test Steps**:
1. Access operator dashboard on tablet
2. Test touch interface for all operator actions
3. Verify form inputs work with virtual keyboard
4. Test file upload from tablet camera

**Expected Results**:
- All functionality works on tablet
- Touch targets are appropriately sized
- Virtual keyboard doesn't obscure inputs
- Camera integration works for attachments

### UAT-C002: Browser Compatibility
**Role**: All users
**Preconditions**: System deployed

**Test Steps**:
1. Test core functionality in:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

**Expected Results**:
- Consistent functionality across browsers
- UI renders correctly in all browsers
- No browser-specific errors
- Performance acceptable on all platforms

---

## Security and Authentication

### UAT-S001: Role-Based Access Control
**Role**: Various
**Preconditions**: Users with different roles exist

**Test Steps**:
1. Login as Operator - verify limited access
2. Login as Planner - verify planning access
3. Login as Admin - verify full access
4. Test unauthorized access attempts

**Expected Results**:
- Users only see appropriate functionality
- Unauthorized actions are blocked
- Clear error messages for access denied
- No data leakage between roles

### UAT-S002: Session Management
**Role**: All users
**Preconditions**: User logged in

**Test Steps**:
1. Login and work normally
2. Leave session idle for extended period
3. Attempt to perform action after timeout
4. Test logout functionality

**Expected Results**:
- Session timeout works correctly
- User redirected to login when expired
- Logout clears session completely
- No lingering access after logout

---

## Error Handling and Edge Cases

### UAT-E001: Network Interruption Recovery
**Role**: Operator
**Preconditions**: WOO in progress with timer running

**Test Steps**:
1. Start WOO and begin timer
2. Simulate network interruption
3. Restore network connection
4. Verify timer and data integrity

**Expected Results**:
- Timer state recovers correctly
- No data loss during interruption
- User notified of connection issues
- Graceful reconnection handling

### UAT-E002: Concurrent User Actions
**Role**: Multiple operators
**Preconditions**: Same WOO available to multiple users

**Test Steps**:
1. Two operators attempt to start same WOO simultaneously
2. Verify system handles concurrency correctly

**Expected Results**:
- Only one operator can start WOO
- Clear messaging about WOO unavailability
- No data corruption from concurrent access
- System maintains data integrity

### UAT-E003: Data Validation and Error Messages
**Role**: All users
**Preconditions**: Forms available for data entry

**Test Steps**:
1. Submit forms with invalid data
2. Test required field validation
3. Test data type validation
4. Test business rule validation

**Expected Results**:
- Clear, helpful error messages
- Form validation prevents invalid submissions
- User guided to correct errors
- No system crashes from invalid data

---

## Acceptance Criteria

### Must Pass:
- All core workflow tests (UAT-OP001 through UAT-OP010)
- End-to-end integration test (UAT-I001)
- Multi-tenant isolation (UAT-I002)
- Role-based access control (UAT-S001)
- Tablet compatibility for operators (UAT-C001)

### Should Pass:
- All reporting tests (UAT-R001 through UAT-R004)
- Performance tests (UAT-I003)
- Browser compatibility (UAT-C002)
- Error handling tests (UAT-E001 through UAT-E003)

### Nice to Have:
- Advanced analytics features
- Additional mobile optimizations
- Enhanced error recovery mechanisms

---

## Test Execution Checklist

- [ ] Test environment prepared and verified
- [ ] Test data seeded appropriately
- [ ] All user roles configured and accessible
- [ ] UAT tests executed in sequence
- [ ] Results documented with screenshots
- [ ] Issues logged with severity ratings
- [ ] Regression testing completed for fixes
- [ ] Final sign-off obtained from stakeholders
