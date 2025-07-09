import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// BetterAuth Core Tables
export const users = pgTable("users", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const sessions = pgTable("sessions", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
});

export const accounts = pgTable("accounts", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verifications = pgTable("verifications", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date())
});

// Multi-tenant Organizations and User Relationships
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  settings: jsonb('settings'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userOrganizations = pgTable('user_organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role').notNull().$type<'owner' | 'admin' | 'member' | 'operator'>(),
  permissions: jsonb('permissions'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const departments = pgTable('departments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// MES Core Tables

// Routings: Define the production paths
export const mesRoutings = pgTable('mes_routings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
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
  operationNumber: integer('operation_number').notNull(),
  operationName: text('operation_name').notNull(),
  description: text('description'),
  departmentId: text('department_id').references(() => departments.id),
  setupTime: integer('setup_time'), // in minutes
  runTime: integer('run_time'), // in minutes
  instructions: text('instructions'),
  requiredSkills: jsonb('required_skills'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Orders: Production orders
export const mesOrders = pgTable('mes_orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
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
  operatorId: text('operator_id').references(() => users.id),
  status: text('status').notNull().default('pending').$type<'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled'>(),
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
});

// Pause Reasons: Standardized reasons for pausing operations
export const mesPauseReasons = pgTable('mes_pause_reasons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull().$type<'planned' | 'unplanned' | 'maintenance' | 'quality' | 'material' | 'other'>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  userOrganizations: many(userOrganizations),
  workOrderOperations: many(mesWorkOrderOperations),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  userOrganizations: many(userOrganizations),
  departments: many(departments),
  routings: many(mesRoutings),
  orders: many(mesOrders),
  pauseReasons: many(mesPauseReasons),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, { fields: [userOrganizations.userId], references: [users.id] }),
  organization: one(organizations, { fields: [userOrganizations.organizationId], references: [organizations.id] }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, { fields: [departments.organizationId], references: [organizations.id] }),
  routingOperations: many(mesRoutingOperations),
}));

export const mesRoutingsRelations = relations(mesRoutings, ({ one, many }) => ({
  organization: one(organizations, { fields: [mesRoutings.organizationId], references: [organizations.id] }),
  operations: many(mesRoutingOperations),
  orders: many(mesOrders),
}));

export const mesRoutingOperationsRelations = relations(mesRoutingOperations, ({ one, many }) => ({
  routing: one(mesRoutings, { fields: [mesRoutingOperations.routingId], references: [mesRoutings.id] }),
  department: one(departments, { fields: [mesRoutingOperations.departmentId], references: [departments.id] }),
  workOrderOperations: many(mesWorkOrderOperations),
}));

export const mesOrdersRelations = relations(mesOrders, ({ one, many }) => ({
  organization: one(organizations, { fields: [mesOrders.organizationId], references: [organizations.id] }),
  routing: one(mesRoutings, { fields: [mesOrders.routingId], references: [mesRoutings.id] }),
  workOrderOperations: many(mesWorkOrderOperations),
}));

export const mesWorkOrderOperationsRelations = relations(mesWorkOrderOperations, ({ one, many }) => ({
  order: one(mesOrders, { fields: [mesWorkOrderOperations.orderId], references: [mesOrders.id] }),
  routingOperation: one(mesRoutingOperations, { fields: [mesWorkOrderOperations.routingOperationId], references: [mesRoutingOperations.id] }),
  operator: one(users, { fields: [mesWorkOrderOperations.operatorId], references: [users.id] }),
  pauseEvents: many(mesPauseEvents),
}));

export const mesPauseReasonsRelations = relations(mesPauseReasons, ({ one, many }) => ({
  organization: one(organizations, { fields: [mesPauseReasons.organizationId], references: [organizations.id] }),
  pauseEvents: many(mesPauseEvents),
}));

export const mesPauseEventsRelations = relations(mesPauseEvents, ({ one }) => ({
  workOrderOperation: one(mesWorkOrderOperations, { fields: [mesPauseEvents.workOrderOperationId], references: [mesWorkOrderOperations.id] }),
  pauseReason: one(mesPauseReasons, { fields: [mesPauseEvents.pauseReasonId], references: [mesPauseReasons.id] }),
}));

// Type exports for use in the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type UserOrganization = typeof userOrganizations.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type MESRouting = typeof mesRoutings.$inferSelect;
export type MESRoutingOperation = typeof mesRoutingOperations.$inferSelect;
export type MESOrder = typeof mesOrders.$inferSelect;
export type MESWorkOrderOperation = typeof mesWorkOrderOperations.$inferSelect;
export type MESPauseReason = typeof mesPauseReasons.$inferSelect;
export type MESPauseEvent = typeof mesPauseEvents.$inferSelect;
