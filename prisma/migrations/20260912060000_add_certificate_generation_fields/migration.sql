-- AlterEnum
ALTER TYPE "CertificateStatus" ADD VALUE 'REVOKED';

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "certificateNumber" TEXT NOT NULL,
ADD COLUMN     "completionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "courseName" TEXT NOT NULL,
ADD COLUMN     "recipientEmail" TEXT NOT NULL,
ADD COLUMN     "recipientName" TEXT NOT NULL,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedReason" TEXT,
ADD COLUMN     "templateId" TEXT NOT NULL DEFAULT 'template-01',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ISSUED';

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");
