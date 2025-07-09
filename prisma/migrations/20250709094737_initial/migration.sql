/*
  Warnings:

  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Test";

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_routings" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mes_routings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_routing_operations" (
    "id" TEXT NOT NULL,
    "routing_id" TEXT NOT NULL,
    "department_id" TEXT,
    "operation_number" INTEGER NOT NULL,
    "operation_name" TEXT NOT NULL,
    "description" TEXT,
    "setup_time" INTEGER,
    "run_time" INTEGER,
    "instructions" TEXT,
    "required_skills" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "mes_routing_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_orders" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "routing_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_start_date" TIMESTAMP(3),
    "scheduled_end_date" TIMESTAMP(3),
    "actual_start_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "notes" TEXT,
    "custom_fields" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mes_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_work_order_operations" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "routing_operation_id" TEXT NOT NULL,
    "operator_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_start_time" TIMESTAMP(3),
    "scheduled_end_time" TIMESTAMP(3),
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "quantity_completed" INTEGER NOT NULL DEFAULT 0,
    "quantity_rejected" INTEGER NOT NULL DEFAULT 0,
    "captured_data" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "mes_work_order_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_pause_reasons" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mes_pause_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mes_pause_events" (
    "id" TEXT NOT NULL,
    "work_order_operation_id" TEXT NOT NULL,
    "pause_reason_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "mes_pause_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mes_routing_operations" ADD CONSTRAINT "mes_routing_operations_routing_id_fkey" FOREIGN KEY ("routing_id") REFERENCES "mes_routings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_routing_operations" ADD CONSTRAINT "mes_routing_operations_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_orders" ADD CONSTRAINT "mes_orders_routing_id_fkey" FOREIGN KEY ("routing_id") REFERENCES "mes_routings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_work_order_operations" ADD CONSTRAINT "mes_work_order_operations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "mes_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_work_order_operations" ADD CONSTRAINT "mes_work_order_operations_routing_operation_id_fkey" FOREIGN KEY ("routing_operation_id") REFERENCES "mes_routing_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_pause_events" ADD CONSTRAINT "mes_pause_events_work_order_operation_id_fkey" FOREIGN KEY ("work_order_operation_id") REFERENCES "mes_work_order_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mes_pause_events" ADD CONSTRAINT "mes_pause_events_pause_reason_id_fkey" FOREIGN KEY ("pause_reason_id") REFERENCES "mes_pause_reasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
