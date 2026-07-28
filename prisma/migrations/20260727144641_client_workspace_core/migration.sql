-- CreateEnum
CREATE TYPE "ClientDocumentType" AS ENUM ('CONTRACT', 'INVOICE', 'RECEIPT', 'WELCOME_PACKET', 'HANDOVER_PACKAGE', 'WARRANTY_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectMilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CLIENT_ACCOUNT_INVITED';
ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_UPLOADED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_PAYMENT_DUE';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_UPDATE_POSTED';
ALTER TYPE "NotificationType" ADD VALUE 'MILESTONE_UPDATED';

-- AlterTable
ALTER TABLE "SalesLead" ADD COLUMN     "clientUserId" TEXT;

-- AlterTable
ALTER TABLE "SalesProject" ADD COLUMN     "progressPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warrantyExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SalesProjectPayment" ADD COLUMN     "label" TEXT,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT;

-- CreateTable
CREATE TABLE "ClientDocument" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "type" "ClientDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "relatedPaymentId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectUpdate" (
    "id" TEXT NOT NULL,
    "salesProjectId" TEXT NOT NULL,
    "completedItems" TEXT[],
    "plannedNextItems" TEXT[],
    "blockers" TEXT,
    "postedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "salesProjectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ProjectMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "percentComplete" INTEGER,
    "order" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientDocument_sequence_key" ON "ClientDocument"("sequence");

-- CreateIndex
CREATE INDEX "ClientDocument_salesLeadId_idx" ON "ClientDocument"("salesLeadId");

-- CreateIndex
CREATE INDEX "ClientDocument_relatedPaymentId_idx" ON "ClientDocument"("relatedPaymentId");

-- CreateIndex
CREATE INDEX "ProjectUpdate_salesProjectId_idx" ON "ProjectUpdate"("salesProjectId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_salesProjectId_order_idx" ON "ProjectMilestone"("salesProjectId", "order");

-- CreateIndex
CREATE INDEX "SalesLead_clientUserId_idx" ON "SalesLead"("clientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesProjectPayment_razorpayOrderId_key" ON "SalesProjectPayment"("razorpayOrderId");

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_relatedPaymentId_fkey" FOREIGN KEY ("relatedPaymentId") REFERENCES "SalesProjectPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "SalesProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "SalesProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

