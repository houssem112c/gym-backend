-- Add a new enum value used for friend-to-friend post sharing notifications.
-- Safe to re-run; no-op if the type or value already exists.

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
		IF NOT EXISTS (
			SELECT 1
			FROM pg_type t
			JOIN pg_enum e ON e.enumtypid = t.oid
			WHERE t.typname = 'NotificationType'
				AND e.enumlabel = 'POST_SHARED'
		) THEN
			ALTER TYPE "NotificationType" ADD VALUE 'POST_SHARED';
		END IF;
	END IF;
END $$;
