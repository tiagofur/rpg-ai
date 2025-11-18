import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });
} catch (error) {
  console.warn("Prisma client initialization failed. Database features will be unavailable.", error);
}

export default fp(async (fastify) => {
  if (prisma) {
    try {
      await prisma.$connect();
      fastify.decorate("prisma", prisma);

      fastify.addHook("onClose", async () => {
        await prisma?.$disconnect();
      });
    } catch (error) {
      console.warn("Failed to connect to database. Database features will be unavailable.", error);
    }
  } else {
    console.warn("Prisma client not initialized. Database features will be unavailable.");
  }
});

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
