-- CreateEnum
CREATE TYPE "SalesQuoteStatus" AS ENUM ('SENT', 'ACCEPTED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SalesLeadActivityType" ADD VALUE 'QUOTE_SENT';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'QUOTE_ACCEPTED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'QUOTE_REJECTED';

-- CreateTable
CREATE TABLE "SalesQuote" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "offeringId" TEXT,
    "title" TEXT NOT NULL,
    "standardAmount" INTEGER,
    "quotedAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "message" TEXT,
    "status" "SalesQuoteStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesQuote_salesLeadId_idx" ON "SalesQuote"("salesLeadId");

-- AddForeignKey
ALTER TABLE "SalesQuote" ADD CONSTRAINT "SalesQuote_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuote" ADD CONSTRAINT "SalesQuote_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuote" ADD CONSTRAINT "SalesQuote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
