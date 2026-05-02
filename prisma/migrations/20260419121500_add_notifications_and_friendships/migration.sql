-- Create missing enums/tables required by current schema.
-- Written to be safe to run on an existing database (no-op if already present).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FriendshipStatus') THEN
    CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'POST_CREATED',
      'POST_SHARED',
      'STORY_CREATED',
      'FRIEND_REQUEST',
      'FRIEND_ACCEPTED',
      'PRIVATE_SESSION_REQUEST',
      'PRIVATE_SESSION_ACCEPTED',
      'PRIVATE_SESSION_DECLINED',
      'PRIVATE_SESSION_CANCELLED'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.friendships') IS NULL THEN
    CREATE TABLE "friendships" (
      "id" TEXT NOT NULL,
      "requesterId" TEXT NOT NULL,
      "addresseeId" TEXT NOT NULL,
      "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,

      CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX "friendships_requesterId_addresseeId_key" ON "friendships"("requesterId", "addresseeId");

    ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    CREATE TABLE "notifications" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "type" "NotificationType" NOT NULL,
      "actorId" TEXT NOT NULL,
      "referenceId" TEXT,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
    );

    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
