-- AlterTable
ALTER TABLE "InterviewLink" ADD COLUMN     "rateLimitCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rateLimitWindowStart" TIMESTAMP(3);
