
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SalesLeadActivityType" ADD VALUE 'CLIENT_ACCOUNT_INVITED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'CLIENT_ACCOUNT_ACTIVATED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'CLIENT_DOCUMENT_UPLOADED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'PROJECT_UPDATE_POSTED';
ALTER TYPE "SalesLeadActivityType" ADD VALUE 'MILESTONE_UPDATED';

