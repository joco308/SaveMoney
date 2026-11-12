import { z } from "zod";

const fechaSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "La fecha debe tener el formato YYYY-MM-DD",
).refine((fecha) => {
  const date = new Date(`${fecha}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === fecha;
}, "La fecha no es válida");

export const movimientoIdSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const listarMovimientosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  id_categoria: z.coerce.number().int().positive().optional(),
  id_metodo_pago: z.coerce.number().int().positive().optional(),
  fecha_desde: fechaSchema.optional(),
  fecha_hasta: fechaSchema.optional(),
}).refine(
  (data) => !data.fecha_desde || !data.fecha_hasta ||
    data.fecha_desde <= data.fecha_hasta,
  {
    message: "La fecha inicial no puede ser posterior a la fecha final",
    path: ["fecha_hasta"],
  },
);

export const crearMovimientoSchema = z.object({
  id_categoria: z.number().int().positive(),
  id_metodo_pago: z.number().int().positive(),
  id_emprendimiento: z.coerce.bigint().positive().optional(),
  monto: z.number()
    .positive("El monto debe ser mayor que cero")
    .max(999999999999.99)
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
      "El monto admite como máximo dos decimales",
    ),
  fecha_movimiento: fechaSchema,
  descripcion: z.string().trim().max(200).optional(),
});

export const actualizarMovimientoSchema = crearMovimientoSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });
