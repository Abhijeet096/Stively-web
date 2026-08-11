-- AlterTable
ALTER TABLE "SalesLead" ADD COLUMN     "inviteAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "inviteOpenedAt" TIMESTAMP(3),
ADD COLUMN     "inviteSentAt" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "inviteTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "SalesLead_inviteToken_key" ON "SalesLead"("inviteToken");

