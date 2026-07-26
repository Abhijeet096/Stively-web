-- CreateEnum
CREATE TYPE "BusinessDataSource" AS ENUM ('GOOGLE_PLACES', 'WEBSITE', 'MANUAL_IMPORT', 'MANUAL_ENTRY');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('NEW', 'ANALYZED', 'PROMOTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "WebsiteAnalysisStatus" AS ENUM ('PENDING', 'ANALYZING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'YOUTUBE', 'X', 'OTHER');

-- CreateEnum
CREATE TYPE "ConnectorType" AS ENUM ('GOOGLE_PLACES', 'WEBSITE', 'MANUAL_IMPORT');

-- CreateEnum
CREATE TYPE "ConnectorRunTrigger" AS ENUM ('MANUAL', 'CRON');

-- CreateEnum
CREATE TYPE "ConnectorRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "BusinessActivityType" AS ENUM ('BUSINESS_DISCOVERED', 'WEBSITE_ANALYZED', 'AI_REPORT_GENERATED', 'SCORE_RECALCULATED', 'DISMISSED', 'REACTIVATED', 'PROMOTED_TO_SALES_LEAD', 'NOTE_ADDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BUSINESS_HIGH_OPPORTUNITY_SCORE';
ALTER TYPE "NotificationType" ADD VALUE 'LEAD_INTELLIGENCE_RUN_FAILED';

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT,
    "industry" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "websiteDomain" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "dataSource" "BusinessDataSource" NOT NULL,
    "status" "BusinessStatus" NOT NULL DEFAULT 'NEW',
    "googlePlaceId" TEXT,
    "googleRating" DOUBLE PRECISION,
    "googleReviewCount" INTEGER,
    "googlePlaceTypes" JSONB,
    "discoveredByRunId" TEXT,
    "promotedSalesLeadId" TEXT,
    "promotedAt" TIMESTAMP(3),
    "promotedById" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProfile" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "handle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessWebsiteAnalysis" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "WebsiteAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "securityScore" INTEGER,
    "seoScore" INTEGER,
    "performanceScore" INTEGER,
    "contentScore" INTEGER,
    "overallScore" INTEGER,
    "checks" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BusinessWebsiteAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AILeadReport" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "opportunityScore" INTEGER NOT NULL,
    "scoreFactors" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "suggestedOutreachMessage" TEXT,
    "scoringConfigId" TEXT,
    "modelUsed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AILeadReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadScoringConfig" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "websiteQualityWeight" INTEGER NOT NULL DEFAULT 25,
    "reviewRatingWeight" INTEGER NOT NULL DEFAULT 20,
    "reviewCountWeight" INTEGER NOT NULL DEFAULT 10,
    "hasWebsiteWeight" INTEGER NOT NULL DEFAULT 10,
    "industryFitWeight" INTEGER NOT NULL DEFAULT 15,
    "growthSignalsWeight" INTEGER NOT NULL DEFAULT 10,
    "contactAvailabilityWeight" INTEGER NOT NULL DEFAULT 10,
    "industryConversionOverrides" JSONB,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadIntelligenceSearchRun" (
    "id" TEXT NOT NULL,
    "connectorType" "ConnectorType" NOT NULL,
    "trigger" "ConnectorRunTrigger" NOT NULL,
    "status" "ConnectorRunStatus" NOT NULL DEFAULT 'RUNNING',
    "input" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "triggeredById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LeadIntelligenceSearchRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessActivity" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "BusinessActivityType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_sequence_key" ON "Business"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Business_googlePlaceId_key" ON "Business"("googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_promotedSalesLeadId_key" ON "Business"("promotedSalesLeadId");

-- CreateIndex
CREATE INDEX "Business_status_idx" ON "Business"("status");

-- CreateIndex
CREATE INDEX "Business_dataSource_idx" ON "Business"("dataSource");

-- CreateIndex
CREATE INDEX "Business_websiteDomain_idx" ON "Business"("websiteDomain");

-- CreateIndex
CREATE INDEX "Business_city_idx" ON "Business"("city");

-- CreateIndex
CREATE INDEX "SocialProfile_businessId_idx" ON "SocialProfile"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProfile_businessId_platform_url_key" ON "SocialProfile"("businessId", "platform", "url");

-- CreateIndex
CREATE INDEX "BusinessWebsiteAnalysis_businessId_idx" ON "BusinessWebsiteAnalysis"("businessId");

-- CreateIndex
CREATE INDEX "BusinessWebsiteAnalysis_status_idx" ON "BusinessWebsiteAnalysis"("status");

-- CreateIndex
CREATE INDEX "AILeadReport_businessId_idx" ON "AILeadReport"("businessId");

-- CreateIndex
CREATE INDEX "AILeadReport_createdAt_idx" ON "AILeadReport"("createdAt");

-- CreateIndex
CREATE INDEX "LeadScoringConfig_active_idx" ON "LeadScoringConfig"("active");

-- CreateIndex
CREATE INDEX "LeadIntelligenceSearchRun_connectorType_idx" ON "LeadIntelligenceSearchRun"("connectorType");

-- CreateIndex
CREATE INDEX "LeadIntelligenceSearchRun_status_idx" ON "LeadIntelligenceSearchRun"("status");

-- CreateIndex
CREATE INDEX "LeadIntelligenceSearchRun_startedAt_idx" ON "LeadIntelligenceSearchRun"("startedAt");

-- CreateIndex
CREATE INDEX "BusinessActivity_businessId_idx" ON "BusinessActivity"("businessId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_discoveredByRunId_fkey" FOREIGN KEY ("discoveredByRunId") REFERENCES "LeadIntelligenceSearchRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_promotedSalesLeadId_fkey" FOREIGN KEY ("promotedSalesLeadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_promotedById_fkey" FOREIGN KEY ("promotedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProfile" ADD CONSTRAINT "SocialProfile_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessWebsiteAnalysis" ADD CONSTRAINT "BusinessWebsiteAnalysis_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AILeadReport" ADD CONSTRAINT "AILeadReport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AILeadReport" ADD CONSTRAINT "AILeadReport_scoringConfigId_fkey" FOREIGN KEY ("scoringConfigId") REFERENCES "LeadScoringConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScoringConfig" ADD CONSTRAINT "LeadScoringConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadIntelligenceSearchRun" ADD CONSTRAINT "LeadIntelligenceSearchRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessActivity" ADD CONSTRAINT "BusinessActivity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessActivity" ADD CONSTRAINT "BusinessActivity_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

