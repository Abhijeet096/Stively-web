-- CreateEnum
CREATE TYPE "RequestQuoteStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'QUOTE_APPROVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestEventType" ADD VALUE 'QUOTE_PROPOSED';
ALTER TYPE "RequestEventType" ADD VALUE 'QUOTE_APPROVED';
ALTER TYPE "RequestEventType" ADD VALUE 'QUOTE_REJECTED';

-- AlterTable
ALTER TABLE "OfferingRequest" ADD COLUMN     "approvedAmount" INTEGER,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "proposedAmount" INTEGER,
ADD COLUMN     "proposedMessage" TEXT,
ADD COLUMN     "quoteRejectionReason" TEXT,
ADD COLUMN     "quoteReviewedAt" TIMESTAMP(3),
ADD COLUMN     "quoteReviewedById" TEXT,
ADD COLUMN     "quoteStatus" "RequestQuoteStatus";

-- CreateIndex
CREATE UNIQUE INDEX "OfferingRequest_orderId_key" ON "OfferingRequest"("orderId");

-- AddForeignKey
ALTER TABLE "OfferingRequest" ADD CONSTRAINT "OfferingRequest_quoteReviewedById_fkey" FOREIGN KEY ("quoteReviewedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingRequest" ADD CONSTRAINT "OfferingRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

