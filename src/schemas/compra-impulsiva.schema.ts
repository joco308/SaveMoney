import { z } from "zod";

const montoSchema = z.number()
  .finite()
  .positive("El monto debe ser mayor que cero")
  .max(999999999999.99)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    "El monto admite como máximo dos decimales",
  );

export const compraImpulsivaIdSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const listarComprasImpulsivasSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  id_estado_espera: z.coerce.number().int().positive().optional(),
});

export const crearCompraImpulsivaSchema = z.object({
  id_categoria: z.number().int().positive(),
  articulo: z.string().trim().min(1).max(120),
  monto_estimado: montoSchema,
  motivo: z.string().trim().max(200).nullable().optional(),
  dias_espera: z.number().int().min(1).max(90),
});

export const actualizarCompraImpulsivaSchema = z.object({
  id_categoria: z.number().int().positive().optional(),
  articulo: z.string().trim().min(1).max(120).optional(),
  monto_estimado: montoSchema.optional(),
  motivo: z.string().trim().max(200).nullable().optional(),
  dias_espera: z.number().int().min(1).max(90).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar" },
);

export const comprarCompraImpulsivaSchema = z.object({
  id_metodo_pago: z.number().int().positive(),
  monto: montoSchema,
  fecha_movimiento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
    .refine((fecha) => {
      const date = new Date(`${fecha}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === fecha;
    }, "La fecha no es válida"),
  id_emprendimiento: z.coerce.bigint().positive().optional(),
  descripcion: z.string().trim().max(200).optional(),
});
