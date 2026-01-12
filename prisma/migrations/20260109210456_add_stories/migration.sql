-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "caption" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
