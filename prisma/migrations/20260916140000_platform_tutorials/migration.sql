-- CreateTable
CREATE TABLE "PlatformTutorial" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformTutorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformTutorial_isActive_sortOrder_idx" ON "PlatformTutorial"("isActive", "sortOrder");
