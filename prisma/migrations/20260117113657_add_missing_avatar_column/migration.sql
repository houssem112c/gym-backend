/*
  Warnings:

  - You are about to drop the `video_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `videos` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('FRONT', 'BACK', 'SIDE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."videos" DROP CONSTRAINT "videos_categoryId_fkey";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "muscleGroup" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "public"."video_categories";

-- DropTable
DROP TABLE "public"."videos";

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "muscleGroup" TEXT,
    "equipment" TEXT,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "durationWeeks" INTEGER,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plan_exercises" (
    "id" TEXT NOT NULL,
    "workoutPlanId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "sets" INTEGER,
    "reps" TEXT,
    "notes" TEXT,

    CONSTRAINT "workout_plan_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress_photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL DEFAULT 'FRONT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_measurements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "arms" DOUBLE PRECISION,
    "legs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_prs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_prs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutPlanId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalVolume" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_logs" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "isPersonalRecord" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_media" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");

-- CreateIndex
CREATE UNIQUE INDEX "feed_likes_userId_postId_key" ON "feed_likes"("userId", "postId");

-- AddForeignKey
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress_photos" ADD CONSTRAINT "user_progress_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_measurements" ADD CONSTRAINT "user_measurements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_prs" ADD CONSTRAINT "user_prs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_prs" ADD CONSTRAINT "user_prs_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_media" ADD CONSTRAINT "feed_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_likes" ADD CONSTRAINT "feed_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_likes" ADD CONSTRAINT "feed_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
