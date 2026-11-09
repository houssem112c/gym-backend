ALTER TABLE "users" ADD COLUMN "qrCodeHash" TEXT;
ALTER TABLE "users" ADD COLUMN "qrCodeIssuedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "users_qrCodeHash_key" ON "users"("qrCodeHash");
