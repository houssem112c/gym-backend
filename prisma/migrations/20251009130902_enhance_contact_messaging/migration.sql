-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContactPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "adminResponse" TEXT,
ADD COLUMN     "priority" "ContactPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "respondedBy" TEXT,
ADD COLUMN     "status" "ContactStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
