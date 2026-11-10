import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL es obligatoria"),

  JWT_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  ),

  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),

  CORS_ORIGIN: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("*"),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");

  console.error(`[env] Variables de entorno inválidas:\n${details}`);
  process.exit(1);
}

export const env = parsed.data;