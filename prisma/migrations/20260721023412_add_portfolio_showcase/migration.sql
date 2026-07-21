-- CreateEnum
CREATE TYPE "PortfolioCategory" AS ENUM ('WEBSITE', 'WEB_APP', 'ECOMMERCE', 'MOBILE_APP', 'BRANDING', 'OTHER');

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientName" TEXT,
    "category" "PortfolioCategory" NOT NULL DEFAULT 'WEBSITE',
    "summary" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "liveUrl" TEXT,
    "tags" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioItem_published_idx" ON "PortfolioItem"("published");
