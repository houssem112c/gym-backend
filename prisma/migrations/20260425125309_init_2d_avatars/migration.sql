/*
  Warnings:

  - You are about to drop the column `modelBucket` on the `user_avatars` table. All the data in the column will be lost.
  - You are about to drop the column `modelPath` on the `user_avatars` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `user_avatars` table. All the data in the column will be lost.
  - You are about to drop the column `providerAvatarId` on the `user_avatars` table. All the data in the column will be lost.
  - You are about to drop the column `providerModelUrl` on the `user_avatars` table. All the data in the column will be lost.
  - You are about to drop the column `providerPreviewUrl` on the `user_avatars` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PrivateSessionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED');

-- DropIndex
DROP INDEX "public"."users_coachId_idx";

-- AlterTable
ALTER TABLE "feed_posts" ADD COLUMN     "sharedPostId" TEXT;

-- AlterTable
ALTER TABLE "user_avatars" DROP COLUMN "modelBucket",
DROP COLUMN "modelPath",
DROP COLUMN "provider",
DROP COLUMN "providerAvatarId",
DROP COLUMN "providerModelUrl",
DROP COLUMN "providerPreviewUrl",
ADD COLUMN     "bodyShape" TEXT NOT NULL DEFAULT 'mesomorph',
ADD COLUMN     "faceStyle" TEXT NOT NULL DEFAULT 'face_1',
ADD COLUMN     "hairColor" TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN     "hairStyle" TEXT NOT NULL DEFAULT 'short',
ADD COLUMN     "outfit" TEXT NOT NULL DEFAULT 'gym_wear_1',
ADD COLUMN     "skinTone" TEXT NOT NULL DEFAULT '#FFE0BD';

-- DropEnum
DROP TYPE "public"."AvatarProvider";

-- CreateTable
CREATE TABLE "course_bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "PrivateSessionStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_bookings_userId_scheduleId_key" ON "course_bookings"("userId", "scheduleId");

-- AddForeignKey
ALTER TABLE "course_bookings" ADD CONSTRAINT "course_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bookings" ADD CONSTRAINT "course_bookings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_sharedPostId_fkey" FOREIGN KEY ("sharedPostId") REFERENCES "feed_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_sessions" ADD CONSTRAINT "private_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_sessions" ADD CONSTRAINT "private_sessions_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
