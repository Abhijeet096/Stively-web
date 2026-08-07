-- CreateEnum
CREATE TYPE "DocumentLifecycleStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "ClientDocument" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "lifecycleStatus" "DocumentLifecycleStatus" NOT NULL DEFAULT 'SENT',
ADD COLUMN     "supersedesId" TEXT,
ADD COLUMN     "templateType" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_type_year_key" ON "DocumentSequence"("type", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDocument_documentNumber_key" ON "ClientDocument"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDocument_supersedesId_key" ON "ClientDocument"("supersedesId");

-- CreateIndex
CREATE INDEX "ClientDocument_templateType_idx" ON "ClientDocument"("templateType");

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "ClientDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

