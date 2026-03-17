CREATE TABLE IF NOT EXISTS "google_oauth_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "supabaseUserId" TEXT,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenType" TEXT,
  "scope" TEXT,
  "expiresAt" TIMESTAMP(3),
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastRefreshedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "google_oauth_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "google_oauth_tokens_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "google_oauth_tokens_userId_key"
  ON "google_oauth_tokens"("userId");

CREATE INDEX IF NOT EXISTS "google_oauth_tokens_supabaseUserId_idx"
  ON "google_oauth_tokens"("supabaseUserId");
