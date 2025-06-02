-- CreateTable
CREATE TABLE "Record" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "clockIn" TEXT NOT NULL,
    "checkOut" TEXT NOT NULL,
    "totalHours" INTEGER NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);
