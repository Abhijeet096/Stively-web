-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'SENT', 'VIEWED', 'COMMENTED', 'REVISION_REQUESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProposalVersionSource" AS ENUM ('AI_INITIAL', 'AI_REGENERATED', 'AI_COPILOT_UPDATE', 'MANUAL_EDIT');

-- CreateEnum
CREATE TYPE "ProposalCommentType" AS ENUM ('COMMENT', 'QUESTION', 'MEETING_REQUEST');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_VIEWED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_COMMENTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_MEETING_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_REVISION_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPOSAL_REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_GENERATED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_SENT';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_VIEWED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_COMMENTED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_REVISION_REQUESTED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_ACCEPTED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_REJECTED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_MEETING_REQUESTED';

-- CreateTable
CREATE TABLE "SalesLeadDiscovery" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "budgetDiscussed" BOOLEAN NOT NULL DEFAULT false,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "budgetNotes" TEXT,
    "timelineDiscussed" BOOLEAN NOT NULL DEFAULT false,
    "timelineExpectation" TEXT,
    "decisionMakerIdentified" BOOLEAN NOT NULL DEFAULT false,
    "decisionMakerName" TEXT,
    "decisionMakerRole" TEXT,
    "requirementsCaptured" BOOLEAN NOT NULL DEFAULT false,
    "requirementsNotes" TEXT,
    "painPoints" TEXT,
    "selectedOfferingIds" TEXT[],
    "customServiceNotes" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesLeadDiscovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionNumber" INTEGER NOT NULL DEFAULT 0,
    "selectedPackageId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "respondedAt" TIMESTAMP(3),
    "clientResponseNote" TEXT,
    "rateLimitWindowStart" TIMESTAMP(3),
    "rateLimitCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalVersion" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "source" "ProposalVersionSource" NOT NULL,
    "content" JSONB NOT NULL,
    "copilotInstruction" TEXT,
    "modelUsed" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalComment" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "type" "ProposalCommentType" NOT NULL DEFAULT 'COMMENT',
    "content" TEXT NOT NULL,
    "clientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesLeadDiscovery_salesLeadId_key" ON "SalesLeadDiscovery"("salesLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_sequence_key" ON "Proposal"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_token_key" ON "Proposal"("token");

-- CreateIndex
CREATE INDEX "Proposal_salesLeadId_idx" ON "Proposal"("salesLeadId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "ProposalVersion_proposalId_idx" ON "ProposalVersion"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVersion_proposalId_versionNumber_key" ON "ProposalVersion"("proposalId", "versionNumber");

-- CreateIndex
CREATE INDEX "ProposalComment_proposalId_idx" ON "ProposalComment"("proposalId");

-- AddForeignKey
ALTER TABLE "SalesLeadDiscovery" ADD CONSTRAINT "SalesLeadDiscovery_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadDiscovery" ADD CONSTRAINT "SalesLeadDiscovery_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVersion" ADD CONSTRAINT "ProposalVersion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVersion" ADD CONSTRAINT "ProposalVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalComment" ADD CONSTRAINT "ProposalComment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

