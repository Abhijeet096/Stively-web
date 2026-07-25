-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InterviewLinkStatus" AS ENUM ('PENDING', 'SENT', 'OPENED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InterviewCategory" AS ENUM ('INTRODUCTION', 'COMMUNICATION', 'BEHAVIOR', 'SALES', 'PROBLEM_SOLVING', 'ROLE_PLAY', 'OBJECTION_HANDLING', 'COMPANY_AWARENESS', 'CAREER_GOALS', 'CLOSING');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('STRONG_HIRE', 'HIRE', 'HOLD', 'REJECT');

-- AlterEnum
ALTER TYPE "TeamMemberRole" ADD VALUE 'RECRUITER';

-- CreateTable
CREATE TABLE "InterviewTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "goals" TEXT[],
    "evaluationCriteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "skills" TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 20,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "templateId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "InterviewLinkStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "categoriesCovered" "InterviewCategory"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "category" "InterviewCategory" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "responseTimeMs" INTEGER,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "overall" DOUBLE PRECISION NOT NULL,
    "communication" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "professionalism" DOUBLE PRECISION NOT NULL,
    "salesSkills" DOUBLE PRECISION,
    "problemSolving" DOUBLE PRECISION NOT NULL,
    "leadershipPotential" DOUBLE PRECISION NOT NULL,
    "learningAbility" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "suggestedTraining" TEXT[],
    "recommendation" "Recommendation" NOT NULL,
    "rawEvaluation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewActivityLog" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewTemplate_name_key" ON "InterviewTemplate"("name");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Candidate_jobId_idx" ON "Candidate"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_jobId_key" ON "Candidate"("email", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewLink_token_key" ON "InterviewLink"("token");

-- CreateIndex
CREATE INDEX "InterviewLink_token_idx" ON "InterviewLink"("token");

-- CreateIndex
CREATE INDEX "InterviewLink_expiresAt_idx" ON "InterviewLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_linkId_key" ON "Interview"("linkId");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE INDEX "Response_interviewId_sequence_idx" ON "Response"("interviewId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Score_interviewId_key" ON "Score"("interviewId");

-- CreateIndex
CREATE INDEX "Score_recommendation_idx" ON "Score"("recommendation");

-- CreateIndex
CREATE INDEX "InterviewActivityLog_interviewId_idx" ON "InterviewActivityLog"("interviewId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InterviewTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewLink" ADD CONSTRAINT "InterviewLink_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "InterviewLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewActivityLog" ADD CONSTRAINT "InterviewActivityLog_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
