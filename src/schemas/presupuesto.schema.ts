import { z } from "zod";
import { dineroSchema } from "./recurso.schema";

export const presupuestoIdSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const presupuestoCategoriaParamsSchema = z.object({
  id: z.coerce.bigint().positive(),
  idLimite: z.coerce.bigint().positive(),
});

export const listarPresupuestosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  anio: z.coerce.number().int().min(2000).max(2100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  id_emprendimiento: z.coerce.bigint().positive().optional(),
});

export const crearPresupuestoSchema = z.object({
  id_emprendimiento: z.coerce.bigint().positive().nullable().optional(),
  anio: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  monto_total: dineroSchema.transform(Number),
  umbral_alerta_pct: z.number().int().min(1).max(100),
});

export const actualizarPresupuestoSchema =
  crearPresupuestoSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debes enviar al menos un campo para actualizar",
    });

export const crearPresupuestoCategoriaSchema = z.object({
  id_categoria: z.number().int().positive(),
  monto_limite: dineroSchema.transform(Number),
  umbral_alerta_pct: z.number().int().min(1).max(100),
});

export const actualizarPresupuestoCategoriaSchema = z.object({
  id_categoria: z.number().int().positive().max(2147483647).optional(),
  monto_limite: dineroSchema.transform(Number).optional(),
  umbral_alerta_pct: z.number().int().min(1).max(100).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Debes enviar al menos un campo para actualizar",
});
