-- CreateTable
CREATE TABLE "CustomerOutreach" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "outreachType" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "customerName" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerOutreach_tenantId_outreachType_periodKey_idx" ON "CustomerOutreach"("tenantId", "outreachType", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOutreach_tenantId_customerPhone_outreachType_periodKey_key" ON "CustomerOutreach"("tenantId", "customerPhone", "outreachType", "periodKey");

-- AddForeignKey
ALTER TABLE "CustomerOutreach" ADD CONSTRAINT "CustomerOutreach_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
