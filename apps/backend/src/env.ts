import { config } from "dotenv";
import { z } from "zod";

config();

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),
  OPENAI_API_KEY: z.string().optional(),

  // Redis configuration
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),

  // Stripe configuration
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY es requerido"),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1, "STRIPE_PUBLISHABLE_KEY es requerido"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET es requerido"),

  // Auth configuration
  JWT_SECRET: z.string().min(1, "JWT_SECRET es requerido"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET es requerido"),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = environmentSchema.parse(process.env);
