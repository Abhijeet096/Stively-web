-- CreateEnum
CREATE TYPE "OfferingCategory" AS ENUM ('TRAINING', 'INTERNSHIP', 'SOFTWARE_DEVELOPMENT', 'WEBSITE_DEVELOPMENT', 'MOBILE_DEVELOPMENT', 'AI_SOLUTIONS', 'DIGITAL_MARKETING', 'CAREER_GUIDANCE', 'CORPORATE_TRAINING', 'SAAS');

-- CreateEnum
CREATE TYPE "OfferingAudience" AS ENUM ('STUDENT', 'BUSINESS', 'BOTH');

-- CreateEnum
CREATE TYPE "OfferingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FREE', 'FIXED', 'SUBSCRIPTION', 'CUSTOM_QUOTE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- CreateTable
CREATE TABLE "Offering" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "category" "OfferingCategory" NOT NULL,
    "audience" "OfferingAudience" NOT NULL,
    "status" "OfferingStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "discountPrice" INTEGER,
    "pricingType" "PricingType" NOT NULL DEFAULT 'FIXED',
    "duration" TEXT,
    "mode" "Mode" NOT NULL DEFAULT 'ONLINE',
    "difficulty" "Difficulty",
    "capacity" INTEGER,
    "whatYoullLearn" TEXT[],
    "benefits" TEXT[],
    "whoItsFor" TEXT[],
    "requirements" TEXT[],
    "faqs" JSONB,
    "curriculum" JSONB,
    "thumbnailUrl" TEXT,
    "bannerUrl" TEXT,
    "gallery" TEXT[],
    "instructorName" TEXT,
    "tags" TEXT[],
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offering_slug_key" ON "Offering"("slug");

-- CreateIndex
CREATE INDEX "Offering_category_idx" ON "Offering"("category");

-- CreateIndex
CREATE INDEX "Offering_audience_idx" ON "Offering"("audience");

-- CreateIndex
CREATE INDEX "Offering_status_idx" ON "Offering"("status");

-- CreateIndex
CREATE INDEX "Offering_featured_idx" ON "Offering"("featured");

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offering" ADD CONSTRAINT "Offering_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
