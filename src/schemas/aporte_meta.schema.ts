import { z } from "zod";
import { idSchema, dineroSchema, fechaSchema } from "./recurso.schema";
export const recursoParamsSchema = z.object({ parentId: idSchema, id: idSchema.optional() });
export const crearSchema = z.object({
  monto: dineroSchema,
  fecha_aporte: fechaSchema,
  nota: z.string().trim().max(200).nullable().optional(),
}).strict();
export const actualizarSchema = crearSchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo");
export type Crear = z.output<typeof crearSchema>;
export type Actualizar = z.output<typeof actualizarSchema>;
