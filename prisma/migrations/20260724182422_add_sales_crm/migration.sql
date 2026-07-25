-- CreateEnum
CREATE TYPE "SalesLeadSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'LINKEDIN', 'COLD_CALLING', 'REFERRAL', 'INDIAMART', 'GOOGLE_MAPS', 'FACEBOOK', 'INSTAGRAM', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SalesLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "SalesLeadActivityType" AS ENUM ('LEAD_CREATED', 'LEAD_ASSIGNED', 'LEAD_REASSIGNED', 'CALL_LOGGED', 'WHATSAPP_LOGGED', 'EMAIL_LOGGED', 'STATUS_CHANGED', 'NOTE_ADDED', 'ATTACHMENT_ADDED', 'MEETING_SCHEDULED', 'PROPOSAL_UPLOADED', 'PROJECT_CREATED', 'PAYMENT_RECEIVED', 'COMMISSION_GENERATED');

-- CreateEnum
CREATE TYPE "SalesFollowUpType" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "SalesFollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesProjectPaymentStatus" AS ENUM ('PENDING', 'DUE', 'PAID');

-- CreateEnum
CREATE TYPE "SalesCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SALES_LEAD_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW_UP_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'SALES_PROJECT_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'COMMISSION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'COMMISSION_PAID';

-- AlterEnum
ALTER TYPE "TeamMemberRole" ADD VALUE 'SALES_MANAGER';

-- CreateTable
CREATE TABLE "SalesLead" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "industry" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "gstNumber" TEXT,
    "source" "SalesLeadSource" NOT NULL,
    "status" "SalesLeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimatedValue" INTEGER,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLeadAssignment" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assignedById" TEXT,
    "reason" "ReassignmentReason" NOT NULL DEFAULT 'INITIAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLeadActivity" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "type" "SalesLeadActivityType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLeadNote" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLeadAttachment" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLeadAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesFollowUp" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT,
    "type" "SalesFollowUpType" NOT NULL DEFAULT 'CALL',
    "status" "SalesFollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "rescheduledFrom" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "salesLeadId" TEXT,
    "assignedToId" TEXT NOT NULL,
    "assignedById" TEXT,
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SalesTaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesProject" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "salesPersonId" TEXT,
    "projectManagerId" TEXT,
    "assignedDeveloperId" TEXT,
    "totalValue" INTEGER NOT NULL,
    "status" "SalesProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetEndDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesProjectPayment" (
    "id" TEXT NOT NULL,
    "salesProjectId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "SalesProjectPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "method" TEXT,
    "reference" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesProjectPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCommission" (
    "id" TEXT NOT NULL,
    "salesPersonId" TEXT NOT NULL,
    "salesProjectId" TEXT NOT NULL,
    "salesProjectPaymentId" TEXT NOT NULL,
    "paymentAmount" INTEGER NOT NULL,
    "commissionPercentage" DOUBLE PRECISION NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "status" "SalesCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesProfile" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "commissionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "monthlyTarget" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesLead_sequence_key" ON "SalesLead"("sequence");

-- CreateIndex
CREATE INDEX "SalesLead_assignedToId_idx" ON "SalesLead"("assignedToId");

-- CreateIndex
CREATE INDEX "SalesLead_status_idx" ON "SalesLead"("status");

-- CreateIndex
CREATE INDEX "SalesLead_source_idx" ON "SalesLead"("source");

-- CreateIndex
CREATE INDEX "SalesLead_city_idx" ON "SalesLead"("city");

-- CreateIndex
CREATE INDEX "SalesLeadAssignment_salesLeadId_idx" ON "SalesLeadAssignment"("salesLeadId");

-- CreateIndex
CREATE INDEX "SalesLeadActivity_salesLeadId_idx" ON "SalesLeadActivity"("salesLeadId");

-- CreateIndex
CREATE INDEX "SalesLeadNote_salesLeadId_idx" ON "SalesLeadNote"("salesLeadId");

-- CreateIndex
CREATE INDEX "SalesLeadAttachment_salesLeadId_idx" ON "SalesLeadAttachment"("salesLeadId");

-- CreateIndex
CREATE INDEX "SalesFollowUp_assignedToId_status_idx" ON "SalesFollowUp"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "SalesFollowUp_dueAt_idx" ON "SalesFollowUp"("dueAt");

-- CreateIndex
CREATE INDEX "SalesTask_assignedToId_status_idx" ON "SalesTask"("assignedToId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesProject_sequence_key" ON "SalesProject"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "SalesProject_salesLeadId_key" ON "SalesProject"("salesLeadId");

-- CreateIndex
CREATE INDEX "SalesProject_salesPersonId_idx" ON "SalesProject"("salesPersonId");

-- CreateIndex
CREATE INDEX "SalesProject_status_idx" ON "SalesProject"("status");

-- CreateIndex
CREATE INDEX "SalesProjectPayment_salesProjectId_idx" ON "SalesProjectPayment"("salesProjectId");

-- CreateIndex
CREATE INDEX "SalesProjectPayment_status_idx" ON "SalesProjectPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCommission_salesProjectPaymentId_key" ON "SalesCommission"("salesProjectPaymentId");

-- CreateIndex
CREATE INDEX "SalesCommission_salesPersonId_status_idx" ON "SalesCommission"("salesPersonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesProfile_teamMemberId_key" ON "SalesProfile"("teamMemberId");

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLead" ADD CONSTRAINT "SalesLead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadAssignment" ADD CONSTRAINT "SalesLeadAssignment_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadAssignment" ADD CONSTRAINT "SalesLeadAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadAssignment" ADD CONSTRAINT "SalesLeadAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadActivity" ADD CONSTRAINT "SalesLeadActivity_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadActivity" ADD CONSTRAINT "SalesLeadActivity_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadNote" ADD CONSTRAINT "SalesLeadNote_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadNote" ADD CONSTRAINT "SalesLeadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadAttachment" ADD CONSTRAINT "SalesLeadAttachment_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadAttachment" ADD CONSTRAINT "SalesLeadAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFollowUp" ADD CONSTRAINT "SalesFollowUp_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFollowUp" ADD CONSTRAINT "SalesFollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFollowUp" ADD CONSTRAINT "SalesFollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTask" ADD CONSTRAINT "SalesTask_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesProject" ADD CONSTRAINT "SalesProject_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesProject" ADD CONSTRAINT "SalesProject_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesProject" ADD CONSTRAINT "SalesProject_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesProject" ADD CONSTRAINT "SalesProject_assignedDeveloperId_fkey" FOREIGN KEY ("assignedDeveloperId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesProjectPayment" ADD CONSTRAINT "SalesProjectPayment_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "SalesProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesProjectPayment" ADD CONSTRAINT "SalesProjectPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "SalesProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_salesProjectPaymentId_fkey" FOREIGN KEY ("salesProjectPaymentId") REFERENCES "SalesProjectPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesProfile" ADD CONSTRAINT "SalesProfile_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
