import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireUsuario } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { paginacionSchema } from "../schemas/recurso.schema";
import { recursoParamsSchema, crearSchema, actualizarSchema } from "../schemas/meta_ahorro.schema";
import * as controller from "../controllers/meta_ahorro.controller";

export const router = Router({ mergeParams: true });
router.use(requireAuth, requireUsuario);
const collectionParams = z.object({});
const itemParams = recursoParamsSchema;
router.get("/", validate({ params: collectionParams, query: paginacionSchema }), controller.listar);
router.get("/:id", validate({ params: itemParams }), controller.obtener);
router.post("/", validate({ params: collectionParams, body: crearSchema }), controller.crear);
router.put("/:id", validate({ params: itemParams, body: actualizarSchema }), controller.actualizar);
router.delete("/:id", validate({ params: itemParams }), controller.eliminar);
