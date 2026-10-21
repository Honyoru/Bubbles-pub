import { PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// TO DO
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
