-- AlterEnum
ALTER TYPE "OfferingCategory" ADD VALUE 'DIGITAL_PRODUCT';

-- AlterTable
ALTER TABLE "Offering" ADD COLUMN     "digitalAssetPath" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "downloadToken" TEXT,
ADD COLUMN     "downloadTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_downloadToken_key" ON "Order"("downloadToken");

