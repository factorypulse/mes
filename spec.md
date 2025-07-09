Product Specification: Lightweight MES / Product Tracking - V1

Version: 1.0
Last Updated: May 28, 2025

1. Introduction & Vision

To create a user-friendly Manufacturing Execution System (MES) focused on product tracking. V1 will provide clarity on Work-In-Progress (WIP), operational status, cycle times, and hold reasons, enabling businesses to efficiently manage and monitor their production processes from order creation to completion.

1. Target Users

    Production Planners/Managers: Define routings, create and manage orders, monitor overall production flow, and analyze performance.
    Shop Floor Operators: View assigned tasks, execute operations, record data, and report progress.
    System Administrators: Manage users, system settings, and configurations (like pause reasons).

2. V1 Core Modules & Features
3.1. Routings Management

    Objective: Allow administrators to define standard production paths for different products.
    User Stories (V1):
        As an Admin/Planner, I want to create, view, edit, and archive product routings, so that different products can follow distinct manufacturing paths.
        As an Admin/Planner, I want to define a sequence of operations (steps) for each routing.
        As an Admin/Planner, I want each operation in a routing to be assignable to a specific organization/department (from existing Org model).
        As an Admin/Planner, I want to define a title, instructions (free text), a target completion time, and define necessary data inputs (text, number, boolean) for each operation, data inputs should be a distinct table, so we can reuse data collections across operations.
        As an Admin/Planner, I want to attach standard work documents or diagrams (e.g., PDFs, images) to an operation definition, so operators can view them.
    Key Attributes for a Routing (MES_Routings):
        id (Primary Key)
        account_id (FK to Accounts, for multi-tenancy)
        name (String, e.g., "Standard Widget Assembly")
        product_identifier (String, optional, e.g., SKU or internal product code)
        is_active (Boolean, default: true)
        created_at, updated_at
    Key Attributes for an Operation Definition (MES_Routing_Operations):
        id (Primary Key)
        mes_routing_id (FK to MES_Routings)
        account_id (FK to Accounts)
        sequence_number (Integer, for ordering)
        title (String, e.g., "QC Check 1")
        org_id (FK to your Orgs table, department responsible)
        target_time_seconds (Integer, e.g., 1800 for 30 minutes)
        instructions (Text field)
        data_input_schema (JSONB, defines input fields for operators. E.g., [{ "name": "measurement_a", "label": "Measurement A (mm)", "type": "number" }, { "name": "qc_passed", "label": "QC Passed?", "type": "boolean" }])
        created_at, updated_at
        Admin Attachments will be handled via ActiveStorage polymorphic association.

3.2. Order Management

    Objective: Enable the creation, tracking, and scheduling of production orders.
    User Stories (V1):
        As a Planner, I want to manually create new production orders, specifying the product, quantity, assigned routing, and a planned launch date.
        As a System, I want to receive production order information via an API (product, quantity, routing ID, optional ERP ref, optional launch date), so external systems can automatically create orders.
        As a Planner, I want to view a list of all orders, filterable by status (Pending, In Progress, On Hold, Completed), and sortable by creation date, launch date, and due date.
        As a Planner, I want to see which orders are due to launch today, this week, or in a custom date range.
    Key Attributes for an Order (MES_Orders):
        id (Primary Key)
        account_id (FK to Accounts)
        order_number (String, System generated, unique within account, e.g., ORD-2025-00001)
        erp_production_order_reference (String, optional)
        product_identifier (String, what is being made)
        quantity (Integer)
        mes_routing_id (FK to MES_Routings)
        status (String, e.g., "Pending", "In Progress", "On Hold", "Completed", "Cancelled")
        current_mes_work_order_operation_id (FK to MES_Work_Order_Operations, nullable, tracks current active step)
        launch_date (Date, planned start date for the order)
        due_date (Date, optional, when the order is expected to be completed)
        completed_at (Timestamp, nullable)
        created_at, updated_at

3.3. Work Order Operation (WOO) Generation & Management

    Objective: Automatically generate and manage the individual operational steps for each production order.
    User Stories (V1):
        As the System, when an Order is created and a Routing is assigned, I want to automatically generate a corresponding set of Work Order Operations (WOOs) based on the steps in the assigned routing, copying relevant details (title, instructions, target time, org_id, data_input_schema).
        As a Planner/Operator, I want each WOO to be clearly linked to its parent Order and its specific operation definition.
        As a System, I want to update the parent Order's current_mes_work_order_operation_id as the WOO progresses.
    Key Attributes for a Work Order Operation (MES_Work_Order_Operations):
        id (Primary Key)
        mes_order_id (FK to MES_Orders)
        mes_routing_operation_id (FK to MES_Routing_Operations, for reference to definition)
        account_id (FK to Accounts)
        org_id (FK to Orgs, copied from MES_Routing_Operations for easier querying)
        title (String, copied from MES_Routing_Operations)
        instructions (Text, copied from MES_Routing_Operations)
        data_input_schema (JSONB, copied from MES_Routing_Operations)
        status (String, e.g., "To Do", "In Progress", "Paused", "Completed", "Skipped")
        sequence_number (Integer, copied from MES_Routing_Operations)
        target_time_seconds (Integer, copied from MES_Routing_Operations)
        actual_start_time (Timestamp, nullable)
        actual_end_time (Timestamp, nullable)
        total_active_time_seconds (Integer, nullable, calculated: End Time - Start Time - Total Pause Durations)
        captured_data (JSONB, nullable, stores operator inputs, e.g., {"measurement_a": 10.5, "qc_passed": true})
        pause_events (JSONB, array of objects, e.g., [{"reason_id": 1, "reason_text": "Machine Down", "start_time": "timestamp", "end_time": "timestamp", "duration_seconds": 600}])
        created_at, updated_at
        Operator Attachments and Admin-Viewable Attachments will be handled via ActiveStorage polymorphic association.

3.4. Operator Workflow & Data Capture

    Objective: Provide an intuitive interface for operators to manage and record their work.
    User Stories (V1):
        As an Operator, I want to see a dashboard/list of WOOs assigned to my Org that are in "To Do" or "Paused" status, prioritized by the parent Order's launch_date then sequence_number.
        As an Operator, I want to select and "Start" a WOO from my list, which should record actual_start_time and change WOO status to "In Progress".
        As an Operator, while a WOO is "In Progress", I want to be able to "Pause" it.
        As an Operator, when I pause a WOO, I must select a reason from a pre-defined list (managed by Admin). The system should record the pause reason and start_time in pause_events.
        As an Operator, I want to "Resume" a paused WOO. The system should record end_time and duration_seconds for the corresponding pause event in pause_events, and set WOO status back to "In Progress".
        As an Operator, when viewing an active WOO, I want to see its title, instructions, and any admin-defined attachments (PDFs should be displayed inline; images should be displayed inline).
        As an Operator, I want to input data (text, numbers, boolean checks) as defined by the data_input_schema for the WOO.
        As an Operator, I want to attach files (e.g., photos of defects) to the WOO.
        As an Operator, when I click "Complete" on a WOO:
            The actual_end_time and total_active_time should be recorded.
            My captured data should be saved to captured_data.
            WOO status changes to "Completed".
            If there is a next WOO in the sequence for the same Order:
                Its status changes to "To Do".
                The parent Order's current_mes_work_order_operation_id updates to this next WOO.
                If the next WOO is for my Org, I am taken back to my dashboard (or it may highlight on the dashboard).
                If the next WOO is for a different Org, it appears on their dashboard.
            If this is the last WOO for the Order, the parent Order status changes to "Completed" and completed_at is set.
            I am returned to my dashboard.
    Technical Considerations :
        Dashboard: Built with React components; real-time updates via WebSockets or polling.
        Timer Logic: Implemented in React state/hooks for client-side timing (start/pause/resume visual feedback). State changes (Start, Pause, Resume, Complete) trigger backend updates via API routes. total_active_time_seconds and pause_events calculated and stored on the backend.
        Data Input Forms: Dynamic React forms generated from data_input_schema, submitted via API routes.
        Inline PDF/Image Display:
            PDFs: Use <embed type="application/pdf" width="100%" height="600px"> or <iframe> in React components. Requires PDF to be accessible via a URL (e.g., S3 or similar storage).
            Images: Use <img> in React components.
        File Uploads: React file input components, with direct upload to storage (e.g., S3) via signed URLs or API routes, optionally enhanced with progress bars.

3.5. Pause Reason Management

    Objective: Allow administrators to define standardized reasons for work interruptions.
    User Stories (V1):
        As an Admin, I want to create, edit, and activate/deactivate pause reasons in a simple list format.
    Key Attributes for a Pause Reason (MES_Pause_Reasons):
        id (Primary Key)
        account_id (FK to Accounts)
        reason_code (String, unique within account, e.g., "MACH_DOWN")
        description (String, e.g., "Machine Breakdown")
        is_active (Boolean, default: true)
        created_at, updated_at

3.6. Reporting & Analytics (V1)

    Objective: Provide initial insights into production performance.
    User Stories (V1):
        As a Planner/Manager, I want to see a Current WIP Dashboard showing:
            A count of Orders by status (Pending, In Progress, On Hold, Completed Today).
            A list of all "In Progress" and "On Hold" Orders, showing current WOO, assigned Org, product, and quantity.
        As a Planner/Manager, I want a Cycle Time Report showing:
            Average, Min, Max total_active_time_seconds for each MES_Routing_Operation across completed WOOs.
            Comparison against target_time_seconds.
            Filterable by date range and MES_Routing.
        As a Planner/Manager, I want a Hold/Pause Analysis Report showing:
            Total time Orders/WOOs spent paused, grouped by MES_Pause_Reason.description.
            Frequency of each pause reason.
            Filterable by date range and Org.
        As a Planner/Manager, I want an Order Schedule Adherence View that lists orders filterable by launch_date (e.g., "Launching Today", "Launching This Week", "Overdue Launch") and their current status.
    Technical Considerations:
        Data derived from MES_Orders, MES_Work_Order_Operations, and MES_Pause_Reasons.
        Use Chart.js for visualizations, leveraging its compatibility with React (or consider a React charting library such as Recharts or Chart.js).
        Backend will perform necessary aggregations. Initial versions may use direct queries; consider database views or materialized views if performance becomes an issue with larger datasets.

4. Technical Implementation Stack & Notes (V1)

    Backend: Next.js 15 API routes (Node.js), PostgreSQL for the database, Redis for caching.
    Frontend: Next.js 15 with App Router, React 19 for all UI and client-side logic.
    State Management: React state/hooks, server actions, and API routes as needed.
    UI Components: shadcn/ui for the design system, lucide for icons.
    Styling: Tailwind CSS 4.
    Authentication/Authorization: BetterAuth for authentication, with role-based access control (MES_Operator, MES_Planner, MES_Admin) implemented in the app logic.
    File Storage: Use a cloud storage provider (e.g., S3) or local storage, integrated via Next.js API routes and React file upload components.
    Background Jobs: Use a Node.js-compatible job queue (e.g., BullMQ with Redis) for background processing (API ingestion, report generation, etc.).
    Usability: Clean, intuitive, and modern interface using shadcn/ui and Tailwind. Tablet-friendly for shop floor use. Light and dark mode supported.
    Performance: Operator actions (Start, Pause, Complete WOO) should have sub-second response times. Reports should load within a reasonable timeframe (e.g., < 5-10 seconds for typical datasets).
    Reliability: Data integrity is paramount. Timers, status changes, and data capture must be accurate.
    Scalability: Design to handle hundreds of routings, thousands of orders, and tens of thousands of WOOs per account without significant degradation.

    Technical Considerations (Frontend):
        - Operator dashboard and all forms are built with React components and shadcn/ui, styled with Tailwind.
        - Timer logic (start/pause/resume/complete) is implemented in React state/hooks, with visual feedback and optimistic UI updates. State changes trigger backend updates via API routes (e.g., /api/mes/woos/[id]/start, /pause, /resume, /complete).
        - Data input forms are React components generated dynamically from the data_input_schema JSON.
        - Inline PDF/Image display: PDFs are rendered using <embed> or <iframe> in React; images use <img>.
        - File uploads use React file input components, with progress bars and direct upload to storage via signed URLs or API routes.
        - Real-time updates (e.g., dashboards) can use WebSockets or polling as needed.

    Technical Considerations (Backend):
        - All business logic and data persistence handled in Next.js API routes (or a Node.js backend if separated).
        - Aggregations for reports are performed in the backend using SQL queries or ORMs (e.g., Prisma, Drizzle).
        - Role-based access control enforced in API routes and UI.
        - Background jobs (e.g., for report generation or API ingestion) are managed with BullMQ and Redis.

    Data Models (V1 - General Conventions)

        Account (existing model)
        User (existing model)
        Org (existing model for departments/organizations)

        mes_routings
            id: string (UUID)
            account_id: string (FK)
            name: string
            product_identifier: string
            is_active: boolean (default: true)
            created_at: datetime
            updated_at: datetime

        mes_routing_operations
            id: string (UUID)
            mes_routing_id: string (FK)
            account_id: string (FK)
            org_id: string (FK)
            sequence_number: integer
            title: string
            target_time_seconds: integer
            instructions: text
            data_input_schema: JSON (see above)
            created_at: datetime
            updated_at: datetime
            attachments: array of file references (admin-defined)

        mes_orders
            id: string (UUID)
            account_id: string (FK)
            mes_routing_id: string (FK)
            order_number: string (unique within account)
            erp_production_order_reference: string
            product_identifier: string
            quantity: integer
            status: string
            current_mes_work_order_operation_id: string (nullable)
            launch_date: date
            due_date: date (nullable)
            completed_at: datetime (nullable)
            created_at: datetime
            updated_at: datetime

        mes_work_order_operations (WOOs)
            id: string (UUID)
            mes_order_id: string (FK)
            mes_routing_operation_id: string (FK)
            account_id: string (FK)
            org_id: string (FK)
            title: string
            instructions: text
            data_input_schema: JSON
            status: string
            sequence_number: integer
            target_time_seconds: integer
            actual_start_time: datetime (nullable)
            actual_end_time: datetime (nullable)
            total_active_time_seconds: integer (nullable)
            captured_data: JSON (nullable)
            pause_events: JSON (nullable, array of {mes_pause_reason_id, pause_reason_text, start_time, end_time, duration_seconds})
            created_at: datetime
            updated_at: datetime
            attachments: array of file references (operator-uploaded)

        mes_pause_reasons
            id: string (UUID)
            account_id: string (FK)
            reason_code: string (unique within account)
            description: string
            is_active: boolean (default: true)
            created_at: datetime
            updated_at: datetime

        File Attachments
            Store file metadata and storage references (e.g., S3 URLs) in a separate table or as arrays in the relevant models.

2. API Endpoints (V1 - High Level)

    POST /api/v1/mes_orders:
        Action: Creates a new MES Order.
        Auth: API Token
        Request Body:
            erp_production_order_reference (String, optional)
            product_identifier (String, required)
            quantity (Integer, required)
            mes_routing_id (Integer, required, ID of an existing MES_Routing) or mes_routing_name (String, if you want to look up by name)
            launch_date (Date string, optional, e.g., "YYYY-MM-DD")
            due_date (Date string, optional, e.g., "YYYY-MM-DD")
        Response:
            Success (201): Order details (JSON) including system-generated order_number.
            Error (4xx): Error details.
    GET /api/v1/mes_orders: List orders (with filters for status, dates).
    GET /api/v1/mes_orders/:id: Get specific order details.
    (Consider other GET endpoints for routings, WOOs if needed for external system visibility, but order creation is primary for V1 API).

3. Non-Functional Requirements (V1)

    Usability: Clean, intuitive interface for operators. Minimal clicks. Tablet-friendly for shop floor.
    Performance: Operator actions (Start, Pause, Complete WOO) should have sub-second response times. Reports should load within a reasonable timeframe (e.g., < 5-10 seconds for typical datasets).
    Reliability: Data integrity is paramount. Timers, status changes, and data capture must be accurate.
    Scalability: Design to handle hundreds of routings, thousands of orders, and tens of thousands of WOOs per account without significant degradation.

5. Future Considerations (Post-V1)

    Conditional Routing Logic (If step A pass -> X, fail -> Y).
    Hierarchical Pause Reasons.
    Advanced Data Input Types (single/multi-select from predefined lists, date/datetime pickers).
    Operator Dashboard auto-refreshing.
    More sophisticated scheduling/prioritization views.
    Direct material consumption tracking per operation.
    User skill/certification checks before starting an operation.
    Barcode/QR code scanning for starting/completing WOOs or identifying products. (i'd like this in V1 if possible? )
