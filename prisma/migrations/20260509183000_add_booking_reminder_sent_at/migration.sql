-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_reminderSentAt_dateTime_idx" ON "Booking"("reminderSentAt", "dateTime");
