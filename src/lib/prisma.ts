import { PrismaClient } from "@prisma/client";

/**
 * Next.js hot-reloads modules in dev, which would otherwise create a new
 * PrismaClient (and a new DB connection pool) on every file save.
 * Caching the instance on `globalThis` in development avoids exhausting
 * the Postgres connection limit. Production always gets a fresh instance
 * per server process, which is correct there.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
