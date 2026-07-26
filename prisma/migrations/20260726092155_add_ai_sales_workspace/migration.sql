-- CreateEnum
CREATE TYPE "MeetingRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- AlterEnum
ALTER TYPE "ProposalCommentType" ADD VALUE 'AI_CHAT';

-- AlterEnum
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROPOSAL_MEETING_CONFIRMED';

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "selectedCalculatorItemIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ProposalComment" ADD COLUMN     "aiAnswer" TEXT;

-- CreateTable
CREATE TABLE "ProposalMeetingRequest" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "preferredAt" TIMESTAMP(3) NOT NULL,
    "clientNote" TEXT,
    "clientName" TEXT,
    "status" "MeetingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "confirmedMethod" "PreferredContactMethod",
    "meetingLink" TEXT,
    "confirmedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalMeetingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalPageView" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "totalActiveMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalPageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalSectionView" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "activeMs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProposalSectionView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalMeetingRequest_proposalId_idx" ON "ProposalMeetingRequest"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalPageView_proposalId_idx" ON "ProposalPageView"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalPageView_proposalId_sessionId_key" ON "ProposalPageView"("proposalId", "sessionId");

-- CreateIndex
CREATE INDEX "ProposalSectionView_proposalId_idx" ON "ProposalSectionView"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalSectionView_proposalId_sessionId_sectionKey_key" ON "ProposalSectionView"("proposalId", "sessionId", "sectionKey");

-- AddForeignKey
ALTER TABLE "ProposalMeetingRequest" ADD CONSTRAINT "ProposalMeetingRequest_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalMeetingRequest" ADD CONSTRAINT "ProposalMeetingRequest_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalPageView" ADD CONSTRAINT "ProposalPageView_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalSectionView" ADD CONSTRAINT "ProposalSectionView_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

