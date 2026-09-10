-- AlterTable
ALTER TABLE "Offering" ADD COLUMN     "allowsGuestCheckout" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promptsPackPrice" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "addons" JSONB,
ADD COLUMN     "autoLoginToken" TEXT,
ADD COLUMN     "autoLoginTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPrimeMember" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primeMemberSince" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_autoLoginToken_key" ON "Order"("autoLoginToken");

