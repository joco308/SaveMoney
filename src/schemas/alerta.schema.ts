import { z } from "zod";
export const lecturaSchema = z.object({ leida: z.boolean() }).strict();
