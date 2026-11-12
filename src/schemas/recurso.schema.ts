import { z } from "zod";

export const idSchema = z.union([
  z.string().regex(/^[1-9]\d*$/),
  z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
]).transform(BigInt).refine((id) => id <= 9223372036854775807n, "ID fuera de rango");
export const paramsSchema = z.object({ id: idSchema });
export const paginacionSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
export const dineroSchema = z.union([z.string(), z.number().finite()])
  .transform(String)
  .refine((value) => /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(value) && Number(value) > 0,
    "El monto debe ser positivo y admitir como máximo 12 enteros y 2 decimales");
export const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(value + "T00:00:00.000Z");
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Fecha inválida").transform((value) => new Date(value + "T00:00:00.000Z"));
export const instanteSchema = z.iso.datetime({ offset: true })
  .transform((value) => new Date(value));
export const catalogoIdSchema = z.number().int().min(1).max(32767);
export const categoriaIdSchema = z.number().int().min(1).max(2147483647);
export const porcentajeSchema = z.number().int().min(1).max(100);
export type Paginacion = z.output<typeof paginacionSchema>;
