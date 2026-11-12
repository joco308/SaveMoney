import { z } from "zod";
import { idSchema, paramsSchema, dineroSchema, porcentajeSchema } from "./recurso.schema";
export const recursoParamsSchema = paramsSchema;
export const crearSchema = z.object({
  id_emprendimiento: idSchema.nullable().optional(),
  anio: z.number().int().min(1).max(9999),
  mes: z.number().int().min(1).max(12),
  monto_total: dineroSchema,
  umbral_alerta_pct: porcentajeSchema,
}).strict();
export const actualizarSchema = crearSchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo");
export type Crear = z.output<typeof crearSchema>;
export type Actualizar = z.output<typeof actualizarSchema>;
