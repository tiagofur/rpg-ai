import { config } from "dotenv";
import { z } from "zod";
config();
const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3333),
    DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),
    OPENAI_API_KEY: z.string().optional()
});
export const env = envSchema.parse(process.env);
