import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Ingresa un correo electrónico válido")
  .max(120, "El correo no puede superar los 120 caracteres")
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no puede superar los 72 caracteres");

const refreshTokenSchema = z
  .string()
  .trim()
  .min(1, "El refresh token es obligatorio")
  .max(256, "El refresh token no es válido");

export const registerSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(1, "Los nombres son obligatorios")
    .max(80, "Los nombres no pueden superar los 80 caracteres"),

  apellidos: z
    .string()
    .trim()
    .min(1, "Los apellidos son obligatorios")
    .max(80, "Los apellidos no pueden superar los 80 caracteres"),

  email: emailSchema,

  password: passwordSchema,

  codigo_moneda: z
    .string()
    .trim()
    .length(3, "El código de moneda debe tener 3 caracteres")
    .transform((codigo) => codigo.toUpperCase()),

  telefono: z
    .string()
    .trim()
    .max(20, "El teléfono no puede superar los 20 caracteres")
    .optional(),

  fecha_nacimiento: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La fecha debe tener el formato YYYY-MM-DD",
    )
    .refine((fecha) => {
      const date = new Date(`${fecha}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === fecha
      );
    }, "La fecha de nacimiento no es válida")
    .optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria").max(72),
});

export const refreshSchema = z.object({
  refreshToken: refreshTokenSchema,
});

export const logoutSchema = z.object({
  refreshToken: refreshTokenSchema,
});
