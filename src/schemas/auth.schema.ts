import { z } from "zod";

export const registerSchema = z.object({
  nombres: z.string().trim().min(2).max(80),
  apellidos: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
  codigo_moneda: z.string().trim().length(3).transform((v) => v.toUpperCase()),
  telefono: z.string().trim().max(20).optional(),
  fecha_nacimiento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(120).transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});
