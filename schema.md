import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// MES Core Tables (StackAuth provides user/team management)

// Departments (optionally scoped to a team)
export const departments = pgTable('departments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull(), // StackAuth team/org ID
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Routings: Define the production paths
export const mesRoutings = pgTable('mes_routings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull(), // StackAuth team/org ID
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull().default('1.0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Routing Operations: Individual operations within a routing
export const mesRoutingOperations = pgTable('mes_routing_operations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  routingId: text('routing_id').notNull().references(() => mesRoutings.id, { onDelete: 'cascade' }),
  departmentId: text('department_id').references(() => departments.id),
  operationNumber: integer('operation_number').notNull(),
  operationName: text('operation_name').notNull(),
  description: text('description'),
  setupTime: integer('setup_time'), // in minutes
  runTime: integer('run_time'), // in minutes
  instructions: text('instructions'),
  requiredSkills: jsonb('required_skills'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  teamId: text('team_id').notNull(), // StackAuth team/org ID
});

// Orders: Production orders
export const mesOrders = pgTable('mes_orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull(), // StackAuth team/org ID
  orderNumber: text('order_number').notNull(),
  routingId: text('routing_id').notNull().references(() => mesRoutings.id),
  quantity: integer('quantity').notNull(),
  priority: integer('priority').default(1),
  status: text('status').notNull().default('pending').$type<'pending' | 'in_progress' | 'completed' | 'cancelled'>(),
  scheduledStartDate: timestamp('scheduled_start_date', { withTimezone: true }),
  scheduledEndDate: timestamp('scheduled_end_date', { withTimezone: true }),
  actualStartDate: timestamp('actual_start_date', { withTimezone: true }),
  actualEndDate: timestamp('actual_end_date', { withTimezone: true }),
  notes: text('notes'),
  customFields: jsonb('custom_fields'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Work Order Operations (WOO): Individual work orders for each operation
export const mesWorkOrderOperations = pgTable('mes_work_order_operations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => mesOrders.id, { onDelete: 'cascade' }),
  routingOperationId: text('routing_operation_id').notNull().references(() => mesRoutingOperations.id),
  operatorId: text('operator_id'), // StackAuth user ID
  status: text('status').notNull().default('pending').$type<'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled' | 'waiting'>(),
  scheduledStartTime: timestamp('scheduled_start_time', { withTimezone: true }),
  scheduledEndTime: timestamp('scheduled_end_time', { withTimezone: true }),
  actualStartTime: timestamp('actual_start_time', { withTimezone: true }),
  actualEndTime: timestamp('actual_end_time', { withTimezone: true }),
  quantityCompleted: integer('quantity_completed').default(0),
  quantityRejected: integer('quantity_rejected').default(0),
  capturedData: jsonb('captured_data'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  teamId: text('team_id').notNull(), // StackAuth team/org ID
});

// Status definitions:
// - 'pending': Ready to be started by an operator
// - 'in_progress': Currently being worked on by an operator
// - 'completed': Finished successfully
// - 'paused': Temporarily stopped (with reason)
// - 'cancelled': Permanently stopped
// - 'waiting': Future operation waiting for previous operations to complete (sequential workflow)

// Pause Reasons: Standardized reasons for pausing operations
export const mesPauseReasons = pgTable('mes_pause_reasons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull(), // StackAuth team/org ID
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull().$type<'planned' | 'unplanned' | 'maintenance' | 'quality' | 'material' | 'other'>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  teamId: text('team_id').notNull(), // StackAuth team/org ID
});

// Pause Events: Track when operations are paused
export const mesPauseEvents = pgTable('mes_pause_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workOrderOperationId: text('work_order_operation_id').notNull().references(() => mesWorkOrderOperations.id, { onDelete: 'cascade' }),
  pauseReasonId: text('pause_reason_id').notNull().references(() => mesPauseReasons.id),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  teamId: text('team_id').notNull(), // StackAuth team/org ID
});

// Relations (MES domain only)
export const departmentsRelations = relations(departments, ({ one, many }) => ({
  routingOperations: many(mesRoutingOperations),
}));

export const mesRoutingsRelations = relations(mesRoutings, ({ many }) => ({
  operations: many(mesRoutingOperations),
  orders: many(mesOrders),
}));

export const mesRoutingOperationsRelations = relations(mesRoutingOperations, ({ one, many }) => ({
  routing: one(mesRoutings, { fields: [mesRoutingOperations.routingId], references: [mesRoutings.id] }),
  department: one(departments, { fields: [mesRoutingOperations.departmentId], references: [departments.id] }),
  workOrderOperations: many(mesWorkOrderOperations),
}));

export const mesOrdersRelations = relations(mesOrders, ({ one, many }) => ({
  routing: one(mesRoutings, { fields: [mesOrders.routingId], references: [mesRoutings.id] }),
  workOrderOperations: many(mesWorkOrderOperations),
}));

export const mesWorkOrderOperationsRelations = relations(mesWorkOrderOperations, ({ one, many }) => ({
  order: one(mesOrders, { fields: [mesWorkOrderOperations.orderId], references: [mesOrders.id] }),
  routingOperation: one(mesRoutingOperations, { fields: [mesWorkOrderOperations.routingOperationId], references: [mesRoutingOperations.id] }),
  pauseEvents: many(mesPauseEvents),
}));

export const mesPauseReasonsRelations = relations(mesPauseReasons, ({ many }) => ({
  pauseEvents: many(mesPauseEvents),
}));

export const mesPauseEventsRelations = relations(mesPauseEvents, ({ one }) => ({
  workOrderOperation: one(mesWorkOrderOperations, { fields: [mesPauseEvents.workOrderOperationId], references: [mesWorkOrderOperations.id] }),
  pauseReason: one(mesPauseReasons, { fields: [mesPauseEvents.pauseReasonId], references: [mesPauseReasons.id] }),
}));

// Type exports for use in the application (MES domain only)
export type Department = typeof departments.$inferSelect;
export type MESRouting = typeof mesRoutings.$inferSelect;
export type MESRoutingOperation = typeof mesRoutingOperations.$inferSelect;
export type MESOrder = typeof mesOrders.$inferSelect;
export type MESWorkOrderOperation = typeof mesWorkOrderOperations.$inferSelect;
export type MESPauseReason = typeof mesPauseReasons.$inferSelect;
export type MESPauseEvent = typeof mesPauseEvents.$inferSelect;
