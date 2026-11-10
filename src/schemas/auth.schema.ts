import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, "refresh_token es obligatorio"),
});

export const logoutSchema = z.object({
  refresh_token: z.string().min(1, "refresh_token es obligatorio"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
