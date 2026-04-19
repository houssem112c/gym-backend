-- Add INTERNAL to AvatarProvider enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'AvatarProvider' AND e.enumlabel = 'INTERNAL'
  ) THEN
    ALTER TYPE "AvatarProvider" ADD VALUE 'INTERNAL';
  END IF;
END $$;
