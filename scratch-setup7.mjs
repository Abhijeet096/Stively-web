import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const password = await bcrypt.hash("TestPass123!", 10);

const student = await prisma.user.upsert({
  where: { email: "ops-test-student@example.com" },
  create: { email: "ops-test-student@example.com", name: "Ops Test Student", role: "STUDENT", password, emailVerified: new Date() },
  update: { password, emailVerified: new Date() },
});

const superAdminUser = await prisma.user.upsert({
  where: { email: "ops-test-superadmin@example.com" },
  create: { email: "ops-test-superadmin@example.com", name: "Ops Test SuperAdmin", role: "SUPER_ADMIN", password, emailVerified: new Date() },
  update: { password, emailVerified: new Date() },
});

const counsellorUser = await prisma.user.upsert({
  where: { email: "ops-test-counsellor@example.com" },
  create: { email: "ops-test-counsellor@example.com", name: "Ops Test Counsellor", role: "ADMIN", password, emailVerified: new Date() },
  update: { password, emailVerified: new Date() },
});

const counsellorTeamMember = await prisma.teamMember.upsert({
  where: { email: "ops-test-counsellor-team@example.com" },
  create: { name: "Priya Counsellor", email: "ops-test-counsellor-team@example.com", role: "COUNSELLOR", userId: counsellorUser.id },
  update: { userId: counsellorUser.id },
});

console.log({ studentId: student.id, superAdminId: superAdminUser.id, counsellorUserId: counsellorUser.id, counsellorTeamMemberId: counsellorTeamMember.id });
await prisma.$disconnect();
