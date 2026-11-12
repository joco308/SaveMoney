import { z } from "zod";
import { idSchema, paramsSchema, dineroSchema, instanteSchema, catalogoIdSchema, categoriaIdSchema } from "./recurso.schema";
export const recursoParamsSchema = paramsSchema;
export const crearSchema = z.object({
  id_categoria: categoriaIdSchema,
  id_estado_espera: catalogoIdSchema,
  articulo: z.string().trim().min(1).max(120),
  monto_estimado: dineroSchema,
  motivo: z.string().trim().max(200).nullable().optional(),
  fecha_inicio_espera: instanteSchema,
  fecha_fin_espera: instanteSchema,
  fecha_resolucion: instanteSchema.nullable().optional(),
  id_movimiento: idSchema.nullable().optional(),
}).strict();
export const actualizarSchema = crearSchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo");
export type Crear = z.output<typeof crearSchema>;
export type Actualizar = z.output<typeof actualizarSchema>;
