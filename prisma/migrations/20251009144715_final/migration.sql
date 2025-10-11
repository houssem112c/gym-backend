-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "BmiStatus" AS ENUM ('OK', 'CAUTION', 'NOT_OK');

-- CreateTable
CREATE TABLE "bmi_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "bmiValue" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "status" "BmiStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bmi_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bmi_records" ADD CONSTRAINT "bmi_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
