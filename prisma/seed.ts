import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean DB before seeding
  await prisma.attendance_records.deleteMany();
  await prisma.employees.deleteMany();
  await prisma.departments.deleteMany();

  // === Departments ===
  const departments = await Promise.all(
    ['Engineering', 'HR', 'IT'].map((name) =>
      prisma.departments.create({
        data: {
          name,
          description: `${name} Department`,
          shift_start: '13:30:00',
          shift_end: '23:00:00',
        },
      }),
    ),
  );

  // === Employees ===
  await Promise.all(
    Array.from({ length: 10 }).map((_, idx) =>
      prisma.employees.create({
        data: {
          department_id:
            departments[Math.floor(Math.random() * departments.length)].id,
          name: faker.person.fullName(),
          employee_code: `${1000 + idx}`,
          designation: faker.person.jobTitle(),
        },
      }),
    ),
  );

  console.log('✅ Seed data created!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
