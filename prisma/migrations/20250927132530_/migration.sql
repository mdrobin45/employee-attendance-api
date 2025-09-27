-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_employee_id_fkey";

-- DropIndex
DROP INDEX "attendance_records_employee_id_key";

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
