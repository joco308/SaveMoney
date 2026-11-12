import { z } from "zod";

export const listarAlertasSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  leida: z.enum(["true", "false"]).optional(),
});

export const alertaIdSchema = z.object({
  id: z.coerce.bigint().positive(),
});
