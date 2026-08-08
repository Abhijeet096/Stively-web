-- AlterEnum
ALTER TYPE "LeadEventType" ADD VALUE 'MEETING_SCHEDULED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MEETING_REMINDER';

-- AlterTable
ALTER TABLE "SalesLeadMeeting" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LeadMeeting" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "method" "PreferredContactMethod",
    "meetingLink" TEXT,
    "notes" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledById" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadMeeting_leadId_idx" ON "LeadMeeting"("leadId");

-- CreateIndex
CREATE INDEX "LeadMeeting_scheduledAt_idx" ON "LeadMeeting"("scheduledAt");

-- AddForeignKey
ALTER TABLE "LeadMeeting" ADD CONSTRAINT "LeadMeeting_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMeeting" ADD CONSTRAINT "LeadMeeting_scheduledById_fkey" FOREIGN KEY ("scheduledById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
