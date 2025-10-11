-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "role" SET DEFAULT 'USER';
