import "dotenv/config";
import { z } from "zod";

/** Trata las variables vacías de `.env` como no definidas. */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalSecret = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
    DIRECT_URL: z.string().min(1, "DIRECT_URL es obligatoria"),
    SUPABASE_URL: optionalUrl,
    SUPABASE_JWKS_URL: optionalUrl,
    SUPABASE_JWT_SECRET: optionalSecret,
    CORS_ORIGIN: z.preprocess(emptyToUndefined, z.string().min(1).default("*")),
  })
  .refine(
    (value) => Boolean(value.SUPABASE_JWT_SECRET || value.SUPABASE_JWKS_URL || value.SUPABASE_URL),
    {
      message:
        "Configura SUPABASE_URL o SUPABASE_JWKS_URL (claves asimétricas) o SUPABASE_JWT_SECRET (HS256 legacy)",
      path: ["SUPABASE_URL"],
    },
  );

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");

  console.error(`[env] Variables de entorno inválidas:\n${details}`);
  process.exit(1);
}

export const env = parsed.data;
