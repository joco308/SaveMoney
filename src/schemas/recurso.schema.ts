import { z } from "zod";

export const paginacionSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
export const dineroSchema = z.union([z.string(), z.number().finite()])
  .transform(String)
  .refine((value) => /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(value) && Number(value) > 0,
    "El monto debe ser positivo y admitir como máximo 12 enteros y 2 decimales");
