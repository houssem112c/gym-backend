/*
  Warnings:

  - Added the required column `categoryId` to the `courses` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- Insert a default category for existing courses
INSERT INTO "categories" ("id", "name", "description", "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'General', 'Default category for existing courses', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable - Add new columns to courses
ALTER TABLE "courses" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "thumbnail" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- Add categoryId column with default value from the General category
ALTER TABLE "courses" ADD COLUMN "categoryId" TEXT;
UPDATE "courses" SET "categoryId" = (SELECT "id" FROM "categories" WHERE "name" = 'General');
ALTER TABLE "courses" ALTER COLUMN "categoryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
