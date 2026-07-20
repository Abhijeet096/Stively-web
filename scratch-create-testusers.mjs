import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const password = await bcrypt.hash("TestPass123!", 10);

const student = await prisma.user.upsert({
  where: { email: "req-test-student@example.com" },
  create: { email: "req-test-student@example.com", name: "Requesty Student", role: "STUDENT", password, emailVerified: new Date() },
  update: { password, emailVerified: new Date() },
});
const business = await prisma.user.upsert({
  where: { email: "req-test-business@example.com" },
  create: { email: "req-test-business@example.com", name: "Requesty Business", role: "CLIENT", companyName: "Acme Corp", password, emailVerified: new Date() },
  update: { password, emailVerified: new Date() },
});
console.log({ student: student.id, business: business.id });
await prisma.$disconnect();
