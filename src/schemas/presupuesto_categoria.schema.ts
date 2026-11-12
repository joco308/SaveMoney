import { z } from "zod";
import { idSchema, dineroSchema, categoriaIdSchema, porcentajeSchema } from "./recurso.schema";
export const recursoParamsSchema = z.object({ parentId: idSchema, id: idSchema.optional() });
export const crearSchema = z.object({
  id_categoria: categoriaIdSchema,
  monto_limite: dineroSchema,
  umbral_alerta_pct: porcentajeSchema,
}).strict();
export const actualizarSchema = crearSchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo");
export type Crear = z.output<typeof crearSchema>;
export type Actualizar = z.output<typeof actualizarSchema>;
