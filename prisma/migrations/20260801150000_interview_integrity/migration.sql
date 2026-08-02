-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INTERVIEW_TERMINATED';

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "terminatedReason" TEXT,
ADD COLUMN     "violationCount" INTEGER NOT NULL DEFAULT 0;
