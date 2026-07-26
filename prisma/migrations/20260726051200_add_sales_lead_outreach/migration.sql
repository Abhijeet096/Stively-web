-- AlterEnum
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'OUTREACH_GENERATED';

-- CreateTable
CREATE TABLE "SalesLeadOutreach" (
    "id" TEXT NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "whatsappMessage" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL,
    "emailBody" TEXT NOT NULL,
    "coldCallScript" TEXT NOT NULL,
    "linkedinMessage" TEXT,
    "modelUsed" TEXT NOT NULL,
    "generatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesLeadOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesLeadOutreach_salesLeadId_idx" ON "SalesLeadOutreach"("salesLeadId");

-- AddForeignKey
ALTER TABLE "SalesLeadOutreach" ADD CONSTRAINT "SalesLeadOutreach_salesLeadId_fkey" FOREIGN KEY ("salesLeadId") REFERENCES "SalesLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesLeadOutreach" ADD CONSTRAINT "SalesLeadOutreach_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

