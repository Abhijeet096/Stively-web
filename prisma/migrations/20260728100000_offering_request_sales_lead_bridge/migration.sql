-- AlterEnum
ALTER TYPE "SalesLeadSource" ADD VALUE 'OFFERING_REQUEST';

-- AlterTable
ALTER TABLE "OfferingRequest" ADD COLUMN     "promotedSalesLeadId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OfferingRequest_promotedSalesLeadId_key" ON "OfferingRequest"("promotedSalesLeadId");

-- AddForeignKey
ALTER TABLE "OfferingRequest" ADD CONSTRAINT "OfferingRequest_promotedSalesLeadId_fkey" FOREIGN KEY ("promotedSalesLeadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

