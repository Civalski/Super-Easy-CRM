ALTER TABLE "users"
ADD COLUMN "subscriptionProvider" TEXT,
ADD COLUMN "subscriptionExternalId" TEXT,
ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive',
ADD COLUMN "subscriptionPlanCode" TEXT,
ADD COLUMN "subscriptionCheckoutUrl" TEXT,
ADD COLUMN "subscriptionNextBillingAt" TIMESTAMP(3),
ADD COLUMN "subscriptionLastWebhookAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_subscriptionExternalId_key" ON "users"("subscriptionExternalId");