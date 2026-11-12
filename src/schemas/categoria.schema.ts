import { z } from "zod";

export const categoriaIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listarCategoriasSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  id_tipo_categoria: z.coerce.number().int().positive().optional(),
});

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1).max(60),
  id_tipo_categoria: z.number().int().positive(),
});

export const actualizarCategoriaSchema = crearCategoriaSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const cambiarEstadoCategoriaSchema = z.object({
  activa: z.boolean(),
});
