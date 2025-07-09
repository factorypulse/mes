-- Migration: Add Data Collection Activities
-- This migration adds the new data collection activity model

-- Data Collection Activity definitions (reusable templates)
CREATE TABLE "MESDataCollectionActivity" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MESDataCollectionActivity_pkey" PRIMARY KEY ("id")
);

-- Junction table: Operations can have multiple data collection activities
CREATE TABLE "MESRoutingOperationDataCollection" (
    "id" TEXT NOT NULL,
    "routingOperationId" TEXT NOT NULL,
    "dataCollectionActivityId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER,

    CONSTRAINT "MESRoutingOperationDataCollection_pkey" PRIMARY KEY ("id")
);

-- Collected data instances (actual data collected during operations)
CREATE TABLE "MESWorkOrderOperationDataCollection" (
    "id" TEXT NOT NULL,
    "workOrderOperationId" TEXT NOT NULL,
    "dataCollectionActivityId" TEXT NOT NULL,
    "collectedData" JSONB NOT NULL,
    "operatorId" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MESWorkOrderOperationDataCollection_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraints
ALTER TABLE "MESDataCollectionActivity" ADD CONSTRAINT "MESDataCollectionActivity_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MESRoutingOperationDataCollection" ADD CONSTRAINT "MESRoutingOperationDataCollection_routingOperationId_fkey" FOREIGN KEY ("routingOperationId") REFERENCES "MESRoutingOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MESRoutingOperationDataCollection" ADD CONSTRAINT "MESRoutingOperationDataCollection_dataCollectionActivityId_fkey" FOREIGN KEY ("dataCollectionActivityId") REFERENCES "MESDataCollectionActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MESWorkOrderOperationDataCollection" ADD CONSTRAINT "MESWorkOrderOperationDataCollection_workOrderOperationId_fkey" FOREIGN KEY ("workOrderOperationId") REFERENCES "MESWorkOrderOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MESWorkOrderOperationDataCollection" ADD CONSTRAINT "MESWorkOrderOperationDataCollection_dataCollectionActivityId_fkey" FOREIGN KEY ("dataCollectionActivityId") REFERENCES "MESDataCollectionActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MESWorkOrderOperationDataCollection" ADD CONSTRAINT "MESWorkOrderOperationDataCollection_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unique constraints
CREATE UNIQUE INDEX "MESDataCollectionActivity_teamId_name_key" ON "MESDataCollectionActivity"("teamId", "name");

CREATE UNIQUE INDEX "MESRoutingOperationDataCollection_routingOperationId_dataCollectionActivityId_key" ON "MESRoutingOperationDataCollection"("routingOperationId", "dataCollectionActivityId");

CREATE UNIQUE INDEX "MESWorkOrderOperationDataCollection_workOrderOperationId_dataCollectionActivityId_key" ON "MESWorkOrderOperationDataCollection"("workOrderOperationId", "dataCollectionActivityId");

-- Performance indexes
CREATE INDEX "MESDataCollectionActivity_teamId_idx" ON "MESDataCollectionActivity"("teamId");
CREATE INDEX "MESDataCollectionActivity_isActive_idx" ON "MESDataCollectionActivity"("isActive");

CREATE INDEX "MESRoutingOperationDataCollection_routingOperationId_idx" ON "MESRoutingOperationDataCollection"("routingOperationId");
CREATE INDEX "MESRoutingOperationDataCollection_dataCollectionActivityId_idx" ON "MESRoutingOperationDataCollection"("dataCollectionActivityId");

CREATE INDEX "MESWorkOrderOperationDataCollection_workOrderOperationId_idx" ON "MESWorkOrderOperationDataCollection"("workOrderOperationId");
CREATE INDEX "MESWorkOrderOperationDataCollection_dataCollectionActivityId_idx" ON "MESWorkOrderOperationDataCollection"("dataCollectionActivityId");
CREATE INDEX "MESWorkOrderOperationDataCollection_operatorId_idx" ON "MESWorkOrderOperationDataCollection"("operatorId");