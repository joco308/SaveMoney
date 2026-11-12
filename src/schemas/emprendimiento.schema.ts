import { z } from "zod";

export const emprendimientoIdSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const listarEmprendimientosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  activo: z.enum(["true", "false"]).optional(),
});

export const crearEmprendimientoSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(300).nullable().optional(),
});

export const actualizarEmprendimientoSchema =
  crearEmprendimientoSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Debes enviar al menos un campo para actualizar",
    });

export const cambiarEstadoEmprendimientoSchema = z.object({
  activo: z.boolean(),
});
