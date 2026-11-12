import { z } from "zod";

const fechaSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
  .refine((fecha) => {
    const date = new Date(`${fecha}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === fecha;
  }, "La fecha no es válida");

const montoSchema = z.number()
  .finite()
  .positive()
  .max(999999999999.99)
  .refine((monto) => Math.abs(monto * 100 - Math.round(monto * 100)) < 1e-8, {
    message: "El monto debe tener como máximo dos decimales",
  });

export const metaAhorroIdSchema = z.object({
  id: z.coerce.bigint().positive(),
});

export const aporteMetaParamsSchema = z.object({
  id: z.coerce.bigint().positive(),
  idAporte: z.coerce.bigint().positive(),
});

export const listarMetasAhorroSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  id_estado_meta: z.coerce.number().int().positive().optional(),
});

export const crearMetaAhorroSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(300).nullable().optional(),
  monto_objetivo: montoSchema,
  fecha_inicio: fechaSchema,
  fecha_limite: fechaSchema,
}).refine(
  (data) => data.fecha_limite >= data.fecha_inicio,
  {
    message: "La fecha límite debe ser igual o posterior a la fecha de inicio",
    path: ["fecha_limite"],
  },
);

export const actualizarMetaAhorroSchema =
  crearMetaAhorroSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "Debes enviar al menos un campo para actualizar" },
  );

export const crearAporteMetaSchema = z.object({
  monto: montoSchema,
  fecha_aporte: fechaSchema,
  nota: z.string().trim().max(200).nullable().optional(),
});

export const actualizarAporteMetaSchema = z.object({
  monto: montoSchema.optional(),
  fecha_aporte: fechaSchema.optional(),
  nota: z.string().trim().max(200).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar" },
);
