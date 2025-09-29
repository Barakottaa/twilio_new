import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a singleton Prisma client
export const prisma = globalThis.__prisma || new PrismaClient({
  log: ['error'], // Only log errors in production
});

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
