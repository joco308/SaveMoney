import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireUsuario } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { idSchema, paginacionSchema } from "../schemas/recurso.schema";
import { recursoParamsSchema, crearSchema, actualizarSchema } from "../schemas/aporte_meta.schema";
import * as controller from "../controllers/aporte_meta.controller";

export const router = Router({ mergeParams: true });
router.use(requireAuth, requireUsuario);
const collectionParams = z.object({ parentId: idSchema });
const itemParams = recursoParamsSchema.extend({ id: idSchema });
router.get("/", validate({ params: collectionParams, query: paginacionSchema }), controller.listar);
router.get("/:id", validate({ params: itemParams }), controller.obtener);
router.post("/", validate({ params: collectionParams, body: crearSchema }), controller.crear);
router.put("/:id", validate({ params: itemParams, body: actualizarSchema }), controller.actualizar);
router.delete("/:id", validate({ params: itemParams }), controller.eliminar);
