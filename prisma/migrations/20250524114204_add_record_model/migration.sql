/*
  Warnings:

  - You are about to drop the column `checkOut` on the `Record` table. All the data in the column will be lost.
  - Added the required column `clockOut` to the `Record` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Record" DROP COLUMN "checkOut",
ADD COLUMN     "clockOut" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ClockLog" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClockLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClockLog" ADD CONSTRAINT "ClockLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
