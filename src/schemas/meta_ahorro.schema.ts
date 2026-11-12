import { z } from "zod";
import { paramsSchema, dineroSchema, fechaSchema, catalogoIdSchema } from "./recurso.schema";
export const recursoParamsSchema = paramsSchema;
export const crearSchema = z.object({
  id_estado_meta: catalogoIdSchema,
  nombre: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(300).nullable().optional(),
  monto_objetivo: dineroSchema,
  fecha_inicio: fechaSchema,
  fecha_limite: fechaSchema,
}).strict();
export const actualizarSchema = crearSchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo");
export type Crear = z.output<typeof crearSchema>;
export type Actualizar = z.output<typeof actualizarSchema>;
