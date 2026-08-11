-- CreateEnum
CREATE TYPE "OnboardingFormStatus" AS ENUM ('DRAFT', 'SENT', 'OPENED', 'SUBMITTED', 'REVIEWED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OnboardingUploadField" AS ENUM ('LOGO', 'BRAND_GUIDELINES', 'BRAND_IMAGE', 'DESIGN_FILE', 'WEBSITE_COPY', 'CONTENT_IMAGE', 'DOCUMENT');

-- CreateTable
CREATE TABLE "OnboardingForm" (
    "id" TEXT NOT NULL,
    "salesProjectId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "OnboardingFormStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "formDate" TIMESTAMP(3),
    "preparedBy" TEXT,
    "company" TEXT,
    "primaryContact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "billingInfo" TEXT,
    "projectName" TEXT,
    "targetAudience" TEXT,
    "approvedScope" TEXT,
    "primaryObjective" TEXT,
    "brandColors" TEXT,
    "brandFonts" TEXT,
    "domainRegistrar" TEXT,
    "hostingProvider" TEXT,
    "githubOrg" TEXT,
    "cloudInfrastructure" TEXT,
    "apiCredentialsNeeded" TEXT,
    "thirdPartyServices" TEXT,
    "productInformation" TEXT,
    "legalPages" TEXT,
    "primaryCommunicationChannel" TEXT,
    "primaryDecisionMaker" TEXT,
    "reviewApprovalContact" TEXT,
    "projectStartDate" TIMESTAMP(3),
    "expectedMilestoneDates" TEXT,
    "notes" TEXT,
    "confirmedAccurate" BOOLEAN NOT NULL DEFAULT false,
    "sentById" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingFormUpload" (
    "id" TEXT NOT NULL,
    "onboardingFormId" TEXT NOT NULL,
    "field" "OnboardingUploadField" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingFormUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingForm_token_key" ON "OnboardingForm"("token");

-- CreateIndex
CREATE INDEX "OnboardingForm_salesProjectId_idx" ON "OnboardingForm"("salesProjectId");

-- CreateIndex
CREATE INDEX "OnboardingForm_status_idx" ON "OnboardingForm"("status");

-- CreateIndex
CREATE INDEX "OnboardingFormUpload_onboardingFormId_idx" ON "OnboardingFormUpload"("onboardingFormId");

-- AddForeignKey
ALTER TABLE "OnboardingForm" ADD CONSTRAINT "OnboardingForm_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "SalesProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingForm" ADD CONSTRAINT "OnboardingForm_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingForm" ADD CONSTRAINT "OnboardingForm_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingFormUpload" ADD CONSTRAINT "OnboardingFormUpload_onboardingFormId_fkey" FOREIGN KEY ("onboardingFormId") REFERENCES "OnboardingForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

