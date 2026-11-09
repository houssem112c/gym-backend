ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailVerificationTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT;

ALTER TABLE "course_bookings"
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "noShow" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'PROMOTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "course_waitlists" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "course_waitlists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attendance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scheduleId" TEXT,
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedOutAt" TIMESTAMP(3),
  "method" TEXT NOT NULL DEFAULT 'QR',
  CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "staff_invitations" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'COACH',
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_waitlists_userId_scheduleId_key"
  ON "course_waitlists"("userId", "scheduleId");
CREATE INDEX IF NOT EXISTS "course_waitlists_scheduleId_status_position_idx"
  ON "course_waitlists"("scheduleId", "status", "position");
CREATE INDEX IF NOT EXISTS "attendance_userId_checkedInAt_idx"
  ON "attendance"("userId", "checkedInAt");
CREATE INDEX IF NOT EXISTS "attendance_scheduleId_checkedInAt_idx"
  ON "attendance"("scheduleId", "checkedInAt");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entityId_idx"
  ON "audit_logs"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx"
  ON "audit_logs"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "staff_invitations_tokenHash_key"
  ON "staff_invitations"("tokenHash");
CREATE INDEX IF NOT EXISTS "staff_invitations_email_expiresAt_idx"
  ON "staff_invitations"("email", "expiresAt");

DO $$ BEGIN
  ALTER TABLE "course_waitlists"
    ADD CONSTRAINT "course_waitlists_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "course_waitlists"
    ADD CONSTRAINT "course_waitlists_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "attendance"
    ADD CONSTRAINT "attendance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "attendance"
    ADD CONSTRAINT "attendance_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
