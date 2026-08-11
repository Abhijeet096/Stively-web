-- CreateEnum
CREATE TYPE "DiscoveryFormStatus" AS ENUM ('DRAFT', 'SENT', 'OPENED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED');

-- DropIndex
DROP INDEX "SalesProject_salesLeadId_key";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "promotedAt" TIMESTAMP(3),
ADD COLUMN     "promotedById" TEXT,
ADD COLUMN     "promotedSalesLeadId" TEXT;

-- AlterTable
ALTER TABLE "SalesProject" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Project',
ADD COLUMN     "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "type" TEXT;

-- CreateTable
CREATE TABLE "DiscoveryForm" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "salesProjectId" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "DiscoveryFormStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "clientCompanyName" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "businessIndustry" TEXT,
    "currentWebsite" TEXT,
    "businessStage" TEXT,
    "primaryGoal" TEXT,
    "projectDescription" TEXT,
    "problemToSolve" TEXT,
    "targetUsers" TEXT,
    "importantFeatures" TEXT,
    "hasExistingSystem" BOOLEAN NOT NULL DEFAULT false,
    "existingSystemIssues" TEXT,
    "successDefinition" TEXT,
    "needsUserAccounts" BOOLEAN NOT NULL DEFAULT false,
    "needsAdminDashboard" BOOLEAN NOT NULL DEFAULT false,
    "needsPayments" BOOLEAN NOT NULL DEFAULT false,
    "needsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "needsEmail" BOOLEAN NOT NULL DEFAULT false,
    "needsSearch" BOOLEAN NOT NULL DEFAULT false,
    "needsBooking" BOOLEAN NOT NULL DEFAULT false,
    "needsContentManagement" BOOLEAN NOT NULL DEFAULT false,
    "needsAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "needsIntegrations" BOOLEAN NOT NULL DEFAULT false,
    "needsAiFeatures" BOOLEAN NOT NULL DEFAULT false,
    "needsMobileResponsive" BOOLEAN NOT NULL DEFAULT false,
    "otherFunctionalNeeds" TEXT,
    "additionalNotes" TEXT,
    "desiredLaunchDate" TIMESTAMP(3),
    "priorityLevel" "LeadPriority",
    "expectedBudgetRange" TEXT,
    "hostingPreference" TEXT,
    "maintenanceRequired" BOOLEAN NOT NULL DEFAULT false,
    "postLaunchSupport" TEXT,
    "importantConstraints" TEXT,
    "commercialNotes" TEXT,
    "sentById" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryForm_token_key" ON "DiscoveryForm"("token");

-- CreateIndex
CREATE INDEX "DiscoveryForm_salesLeadId_idx" ON "DiscoveryForm"("salesLeadId");

-- CreateIndex
CREATE INDEX "DiscoveryForm_status_idx" ON "DiscoveryForm"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_promotedSalesLeadId_key" ON "Lead"("promotedSalesLeadId");

-- CreateIndex
CREATE INDEX "SalesProject_salesLeadId_idx" ON "SalesProject"("salesLeadId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_promotedSalesLeadId_fkey" FOREIGN KEY ("promotedSalesLeadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_promotedById_fkey" FOREIGN KEY ("promotedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryForm" ADD CONSTRAINT "DiscoveryForm_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryForm" ADD CONSTRAINT "DiscoveryForm_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryForm" ADD CONSTRAINT "DiscoveryForm_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

