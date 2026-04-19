-- Add optional instructorId to courses so Prisma queries match the DB

ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "instructorId" TEXT;

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'courses_instructorId_fkey'
  ) THEN
    ALTER TABLE "courses"
      ADD CONSTRAINT "courses_instructorId_fkey"
      FOREIGN KEY ("instructorId")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
