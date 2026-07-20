-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('STUDENT', 'BUSINESS');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'COUNSELLING_SCHEDULED', 'WAITING_FOR_PAYMENT', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PreferredContactMethod" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'GOOGLE_MEET', 'ZOOM');

-- CreateEnum
CREATE TYPE "RequestEventType" AS ENUM ('CREATED', 'STEP_SAVED', 'SUBMITTED', 'STATUS_CHANGED', 'COUNSELLOR_ASSIGNED', 'SALESPERSON_ASSIGNED', 'NOTE_ADDED', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "OfferingRequest" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "offeringId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "RequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "assignedCounsellorId" TEXT,
    "assignedSalesPersonId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "details" JSONB,
    "notes" TEXT,
    "internalNotes" TEXT,
    "preferredContactMethod" "PreferredContactMethod",
    "preferredMeetingTime" TEXT,
    "source" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingRequestHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" "RequestEventType" NOT NULL,
    "fromStatus" "RequestStatus",
    "toStatus" "RequestStatus",
    "description" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferingRequestHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfferingRequest_sequence_key" ON "OfferingRequest"("sequence");

-- CreateIndex
CREATE INDEX "OfferingRequest_userId_idx" ON "OfferingRequest"("userId");

-- CreateIndex
CREATE INDEX "OfferingRequest_offeringId_idx" ON "OfferingRequest"("offeringId");

-- CreateIndex
CREATE INDEX "OfferingRequest_status_idx" ON "OfferingRequest"("status");

-- CreateIndex
CREATE INDEX "OfferingRequest_requestType_idx" ON "OfferingRequest"("requestType");

-- CreateIndex
CREATE INDEX "OfferingRequestHistory_requestId_idx" ON "OfferingRequestHistory"("requestId");

-- AddForeignKey
ALTER TABLE "OfferingRequest" ADD CONSTRAINT "OfferingRequest_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingRequest" ADD CONSTRAINT "OfferingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingRequest" ADD CONSTRAINT "OfferingRequest_assignedCounsellorId_fkey" FOREIGN KEY ("assignedCounsellorId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingRequest" ADD CONSTRAINT "OfferingRequest_assignedSalesPersonId_fkey" FOREIGN KEY ("assignedSalesPersonId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingRequestHistory" ADD CONSTRAINT "OfferingRequestHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OfferingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
