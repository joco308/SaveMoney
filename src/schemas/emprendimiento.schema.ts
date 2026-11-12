import { z } from "zod";
import { paramsSchema } from "./recurso.schema";
export const recursoParamsSchema = paramsSchema;
export const crearSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(300).nullable().optional(),
  activo: z.boolean(),
}).strict();
export const actualizarSchema = crearSchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo");
export type Crear = z.output<typeof crearSchema>;
export type Actualizar = z.output<typeof actualizarSchema>;
