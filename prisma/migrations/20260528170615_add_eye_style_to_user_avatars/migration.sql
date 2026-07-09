-- AlterTable
ALTER TABLE "user_avatars" ADD COLUMN     "eyeStyle" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "mouthStyle" TEXT NOT NULL DEFAULT 'smile';
