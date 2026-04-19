-- Add COACH role + user coach relationship fields

-- Add enum value if it doesn't exist (safe across environments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel = 'COACH'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'COACH';
  END IF;
END $$;

-- Add missing columns used by the current Prisma schema
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "coachId" TEXT,
  ADD COLUMN IF NOT EXISTS "trainingFrequency" INTEGER,
  ADD COLUMN IF NOT EXISTS "trainingDays" INTEGER[];

-- Add FK constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_coachId_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_coachId_fkey"
      FOREIGN KEY ("coachId") REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS "users_coachId_idx" ON "users"("coachId");
