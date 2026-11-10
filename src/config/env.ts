import "dotenv/config";
import { z } from "zod";

/** Trata las variables vacías de `.env` como no definidas. */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalSecret = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL es obligatoria"),
  SUPABASE_URL: optionalUrl,
  SUPABASE_JWKS_URL: optionalUrl,
  SUPABASE_JWT_SECRET: optionalSecret,
  CORS_ORIGIN: z.preprocess(emptyToUndefined, z.string().min(1).default("*")),
  AUTH_JWT_SECRET: z.string().min(32, "AUTH_JWT_SECRET debe tener al menos 32 caracteres"),
  AUTH_JWT_ISSUER: z.preprocess(emptyToUndefined, z.string().min(1).default("savemoney")),
  AUTH_ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
  AUTH_REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(604800),
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
