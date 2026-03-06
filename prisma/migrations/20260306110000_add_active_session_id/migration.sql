-- Add per-user active session guard for single-session login
ALTER TABLE "users"
ADD COLUMN "activeSessionId" TEXT;
