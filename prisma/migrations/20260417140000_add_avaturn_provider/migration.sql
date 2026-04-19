-- Add AVATURN to AvatarProvider enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AvatarProvider' AND e.enumlabel = 'AVATURN'
  ) THEN
    ALTER TYPE "AvatarProvider" ADD VALUE 'AVATURN';
  END IF;
END $$;
