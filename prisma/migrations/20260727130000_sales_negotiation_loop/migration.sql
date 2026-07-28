-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SALES_MEETING_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'SALES_QUOTE_SENT';
ALTER TYPE "NotificationType" ADD VALUE 'SALES_QUOTE_RESPONDED';

-- CreateTable
CREATE TABLE "SalesLeadMeeting" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "method" "PreferredContactMethod",
    "meetingLink" TEXT,
    "notes" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLeadMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesLeadMessage" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "senderId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLeadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesLeadMeeting_salesLeadId_idx" ON "SalesLeadMeeting"("salesLeadId");

-- CreateIndex
CREATE INDEX "SalesLeadMeeting_scheduledAt_idx" ON "SalesLeadMeeting"("scheduledAt");

-- CreateIndex
CREATE INDEX "SalesLeadMessage_salesLeadId_idx" ON "SalesLeadMessage"("salesLeadId");

-- AddForeignKey
ALTER TABLE "SalesLeadMeeting" ADD CONSTRAINT "SalesLeadMeeting_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadMeeting" ADD CONSTRAINT "SalesLeadMeeting_scheduledById_fkey" FOREIGN KEY ("scheduledById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadMessage" ADD CONSTRAINT "SalesLeadMessage_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadMessage" ADD CONSTRAINT "SalesLeadMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
