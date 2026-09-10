-- CreateEnum
CREATE TYPE "AiTutorMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "AiTutorMessage" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "role" "AiTutorMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTutorMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiTutorMessage_studentId_lessonId_idx" ON "AiTutorMessage"("studentId", "lessonId");

-- CreateIndex
CREATE INDEX "AiTutorMessage_studentId_createdAt_idx" ON "AiTutorMessage"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiTutorMessage" ADD CONSTRAINT "AiTutorMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTutorMessage" ADD CONSTRAINT "AiTutorMessage_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

