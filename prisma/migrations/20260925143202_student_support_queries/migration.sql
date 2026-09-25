-- CreateEnum
CREATE TYPE "StudentQueryStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'STUDENT_QUERY_SUBMITTED';

-- CreateTable
CREATE TABLE "StudentQuery" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "StudentQueryStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentQuery_studentId_idx" ON "StudentQuery"("studentId");

-- CreateIndex
CREATE INDEX "StudentQuery_status_idx" ON "StudentQuery"("status");

-- AddForeignKey
ALTER TABLE "StudentQuery" ADD CONSTRAINT "StudentQuery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQuery" ADD CONSTRAINT "StudentQuery_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
