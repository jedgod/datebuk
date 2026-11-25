CREATE TABLE "MobileCallToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MobileCallToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileCallToken_token_key" ON "MobileCallToken"("token");
CREATE INDEX "MobileCallToken_userId_active_idx" ON "MobileCallToken"("userId", "active");
ALTER TABLE "MobileCallToken" ADD CONSTRAINT "MobileCallToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
