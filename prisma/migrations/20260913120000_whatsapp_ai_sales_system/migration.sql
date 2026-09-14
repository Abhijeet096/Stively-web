-- CreateEnum
CREATE TYPE "WhatsAppContactSource" AS ENUM ('INSTAGRAM_CTA', 'DIRECT_WHATSAPP', 'AD_CAMPAIGN', 'POST_PURCHASE', 'OTHER');

-- CreateEnum
CREATE TYPE "WhatsAppConversationState" AS ENUM ('NEW', 'MENU_SENT', 'QUALIFYING', 'AI_HANDLING', 'ESCALATED_TO_HUMAN', 'CONVERTED', 'OPTED_OUT');

-- CreateEnum
CREATE TYPE "WhatsAppMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "postPurchaseProcessedAt" TIMESTAMP(3),
ADD COLUMN     "whatsappConfirmationSentAt" TIMESTAMP(3),
ADD COLUMN     "whatsappCrossSellSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WhatsAppContact" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "source" "WhatsAppContactSource" NOT NULL DEFAULT 'OTHER',
    "conversationState" "WhatsAppConversationState" NOT NULL DEFAULT 'NEW',
    "linkedUserId" TEXT,
    "linkedLeadId" TEXT,
    "linkedSalesLeadId" TEXT,
    "optedOutAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "whatsappContactId" TEXT NOT NULL,
    "direction" "WhatsAppMessageDirection" NOT NULL,
    "content" TEXT NOT NULL,
    "metaMessageId" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppContact_whatsappId_key" ON "WhatsAppContact"("whatsappId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppContact_phoneNumber_key" ON "WhatsAppContact"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppContact_linkedLeadId_key" ON "WhatsAppContact"("linkedLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppContact_linkedSalesLeadId_key" ON "WhatsAppContact"("linkedSalesLeadId");

-- CreateIndex
CREATE INDEX "WhatsAppContact_conversationState_idx" ON "WhatsAppContact"("conversationState");

-- CreateIndex
CREATE INDEX "WhatsAppContact_linkedUserId_idx" ON "WhatsAppContact"("linkedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_metaMessageId_key" ON "WhatsAppMessage"("metaMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_whatsappContactId_createdAt_idx" ON "WhatsAppMessage"("whatsappContactId", "createdAt");

-- AddForeignKey
ALTER TABLE "WhatsAppContact" ADD CONSTRAINT "WhatsAppContact_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppContact" ADD CONSTRAINT "WhatsAppContact_linkedLeadId_fkey" FOREIGN KEY ("linkedLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppContact" ADD CONSTRAINT "WhatsAppContact_linkedSalesLeadId_fkey" FOREIGN KEY ("linkedSalesLeadId") REFERENCES "SalesLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_whatsappContactId_fkey" FOREIGN KEY ("whatsappContactId") REFERENCES "WhatsAppContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

