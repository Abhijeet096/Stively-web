-- CreateEnum
CREATE TYPE "OperationItemType" AS ENUM ('REQUEST', 'ORDER');

-- CreateEnum
CREATE TYPE "OperationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('COUNSELLOR', 'SALES', 'SUPPORT', 'MENTOR');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'ASSIGNED', 'REASSIGNED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'DUE_DATE_CHANGED', 'MEETING_SCHEDULED', 'PAYMENT_RECEIVED', 'NOTE_ADDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TeamMemberRole" ADD VALUE 'COUNSELLOR';
ALTER TYPE "TeamMemberRole" ADD VALUE 'SUPPORT';

-- CreateTable
CREATE TABLE "OperationItem" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "type" "OperationItemType" NOT NULL,
    "requestId" TEXT,
    "orderId" TEXT,
    "assignedToId" TEXT,
    "priority" "OperationPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationAssignment" (
    "id" TEXT NOT NULL,
    "operationItemId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignedById" TEXT,
    "role" "AssignmentRole" NOT NULL,
    "reason" "ReassignmentReason" NOT NULL DEFAULT 'INITIAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "operationItemId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalComment" (
    "id" TEXT NOT NULL,
    "operationItemId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "operationItemId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "method" "PreferredContactMethod",
    "notes" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationItem_sequence_key" ON "OperationItem"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "OperationItem_requestId_key" ON "OperationItem"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationItem_orderId_key" ON "OperationItem"("orderId");

-- CreateIndex
CREATE INDEX "OperationItem_assignedToId_idx" ON "OperationItem"("assignedToId");

-- CreateIndex
CREATE INDEX "OperationItem_type_idx" ON "OperationItem"("type");

-- CreateIndex
CREATE INDEX "OperationAssignment_operationItemId_idx" ON "OperationAssignment"("operationItemId");

-- CreateIndex
CREATE INDEX "ActivityLog_operationItemId_idx" ON "ActivityLog"("operationItemId");

-- CreateIndex
CREATE INDEX "InternalComment_operationItemId_idx" ON "InternalComment"("operationItemId");

-- CreateIndex
CREATE INDEX "Meeting_operationItemId_idx" ON "Meeting"("operationItemId");

-- CreateIndex
CREATE INDEX "Meeting_scheduledAt_idx" ON "Meeting"("scheduledAt");

-- AddForeignKey
ALTER TABLE "OperationItem" ADD CONSTRAINT "OperationItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OfferingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationItem" ADD CONSTRAINT "OperationItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationItem" ADD CONSTRAINT "OperationItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationAssignment" ADD CONSTRAINT "OperationAssignment_operationItemId_fkey" FOREIGN KEY ("operationItemId") REFERENCES "OperationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationAssignment" ADD CONSTRAINT "OperationAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationAssignment" ADD CONSTRAINT "OperationAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_operationItemId_fkey" FOREIGN KEY ("operationItemId") REFERENCES "OperationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalComment" ADD CONSTRAINT "InternalComment_operationItemId_fkey" FOREIGN KEY ("operationItemId") REFERENCES "OperationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalComment" ADD CONSTRAINT "InternalComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_operationItemId_fkey" FOREIGN KEY ("operationItemId") REFERENCES "OperationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_scheduledById_fkey" FOREIGN KEY ("scheduledById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
