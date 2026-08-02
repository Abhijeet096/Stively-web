-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN     "challenge" TEXT,
ADD COLUMN     "features" JSONB,
ADD COLUMN     "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mockupImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "outcomes" JSONB,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "solution" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioItem_slug_key" ON "PortfolioItem"("slug");
