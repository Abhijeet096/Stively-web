-- CreateEnum
CREATE TYPE "AcquisitionChannel" AS ENUM ('WEBSITE', 'GOOGLE_SEARCH', 'GOOGLE_ADS', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'REFERRAL', 'DIRECT', 'INTERNSHALA', 'NAUKRI', 'INDEED', 'MANUAL_ENTRY', 'OTHER');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('FOUNDER', 'SALESPERSON', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReassignmentReason" AS ENUM ('INITIAL', 'SLA_BREACH', 'UNAVAILABLE', 'MANUAL_OVERRIDE');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "acquisitionChannel" "AcquisitionChannel",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- AlterTable
ALTER TABLE "LeadAssignment" DROP COLUMN "reason",
ADD COLUMN     "reason" "ReassignmentReason" NOT NULL DEFAULT 'INITIAL';

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "email" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "TeamMemberRole" NOT NULL;

-- DropEnum
DROP TYPE "ReassignReason";

-- DropEnum
DROP TYPE "TeamRole";

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_leadType_key" ON "Lead"("email", "leadType");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");
