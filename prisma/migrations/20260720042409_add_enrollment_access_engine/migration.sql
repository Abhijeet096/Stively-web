-- CreateEnum
CREATE TYPE "OfferingEnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EnrollmentEventType" AS ENUM ('CREATED', 'ACTIVATED', 'PAUSED', 'RESUMED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'EXTENDED', 'ACCESS_GRANTED', 'ACCESS_REVOKED', 'PROGRESS_UPDATED');

-- CreateEnum
CREATE TYPE "AccessGrantReason" AS ENUM ('PAYMENT_CONFIRMED', 'ADMIN_APPROVED', 'FREE_OFFERING', 'MANUAL_OVERRIDE', 'POLICY_VIOLATION', 'EXPIRED', 'SUBSCRIPTION_ENDED');

-- CreateTable
CREATE TABLE "OfferingEnrollment" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "orderId" TEXT,
    "offeringRequestId" TEXT,
    "status" "OfferingEnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "currentModule" TEXT,
    "progressPercentage" INTEGER NOT NULL DEFAULT 0,
    "accessGranted" BOOLEAN NOT NULL DEFAULT false,
    "accessGrantedAt" TIMESTAMP(3),
    "accessRevokedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentHistory" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "eventType" "EnrollmentEventType" NOT NULL,
    "fromStatus" "OfferingEnrollmentStatus",
    "toStatus" "OfferingEnrollmentStatus",
    "description" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessGrant" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "reason" "AccessGrantReason" NOT NULL,
    "grantedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressSnapshot" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "progressPercentage" INTEGER NOT NULL,
    "currentModule" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfferingEnrollment_sequence_key" ON "OfferingEnrollment"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingEnrollment_orderId_key" ON "OfferingEnrollment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingEnrollment_offeringRequestId_key" ON "OfferingEnrollment"("offeringRequestId");

-- CreateIndex
CREATE INDEX "OfferingEnrollment_studentId_idx" ON "OfferingEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "OfferingEnrollment_offeringId_idx" ON "OfferingEnrollment"("offeringId");

-- CreateIndex
CREATE INDEX "OfferingEnrollment_status_idx" ON "OfferingEnrollment"("status");

-- CreateIndex
CREATE INDEX "EnrollmentHistory_enrollmentId_idx" ON "EnrollmentHistory"("enrollmentId");

-- CreateIndex
CREATE INDEX "AccessGrant_enrollmentId_idx" ON "AccessGrant"("enrollmentId");

-- CreateIndex
CREATE INDEX "ProgressSnapshot_enrollmentId_idx" ON "ProgressSnapshot"("enrollmentId");

-- AddForeignKey
ALTER TABLE "OfferingEnrollment" ADD CONSTRAINT "OfferingEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingEnrollment" ADD CONSTRAINT "OfferingEnrollment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingEnrollment" ADD CONSTRAINT "OfferingEnrollment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingEnrollment" ADD CONSTRAINT "OfferingEnrollment_offeringRequestId_fkey" FOREIGN KEY ("offeringRequestId") REFERENCES "OfferingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentHistory" ADD CONSTRAINT "EnrollmentHistory_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "OfferingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "OfferingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessGrant" ADD CONSTRAINT "AccessGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressSnapshot" ADD CONSTRAINT "ProgressSnapshot_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "OfferingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
