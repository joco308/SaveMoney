import { Router } from "express";
import {
  requireAuth,
  requireUsuario,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  metaAhorroIdSchema,
  aporteMetaParamsSchema,
  listarMetasAhorroSchema,
  crearMetaAhorroSchema,
  actualizarMetaAhorroSchema,
  crearAporteMetaSchema,
  actualizarAporteMetaSchema,
} from "../schemas/meta-ahorro.schema";
import {
  listarMetasAhorroController,
  obtenerMetaAhorroController,
  crearMetaAhorroController,
  actualizarMetaAhorroController,
  eliminarMetaAhorroController,
  cancelarMetaAhorroController,
  listarAportesMetaController,
  crearAporteMetaController,
  actualizarAporteMetaController,
  eliminarAporteMetaController,
} from "../controllers/meta-ahorro.controller";

export const metaAhorroRouter = Router();

metaAhorroRouter.use(requireAuth, requireUsuario);

metaAhorroRouter.get(
  "/",
  validate({ query: listarMetasAhorroSchema }),
  listarMetasAhorroController,
);

metaAhorroRouter.get(
  "/:id/aportes",
  validate({ params: metaAhorroIdSchema }),
  listarAportesMetaController,
);

metaAhorroRouter.post(
  "/:id/aportes",
  validate({
    params: metaAhorroIdSchema,
    body: crearAporteMetaSchema,
  }),
  crearAporteMetaController,
);

metaAhorroRouter.put(
  "/:id/aportes/:idAporte",
  validate({
    params: aporteMetaParamsSchema,
    body: actualizarAporteMetaSchema,
  }),
  actualizarAporteMetaController,
);

metaAhorroRouter.delete(
  "/:id/aportes/:idAporte",
  validate({ params: aporteMetaParamsSchema }),
  eliminarAporteMetaController,
);

metaAhorroRouter.patch(
  "/:id/cancelar",
  validate({ params: metaAhorroIdSchema }),
  cancelarMetaAhorroController,
);

metaAhorroRouter.get(
  "/:id",
  validate({ params: metaAhorroIdSchema }),
  obtenerMetaAhorroController,
);

metaAhorroRouter.post(
  "/",
  validate({ body: crearMetaAhorroSchema }),
  crearMetaAhorroController,
);

metaAhorroRouter.put(
  "/:id",
  validate({
    params: metaAhorroIdSchema,
    body: actualizarMetaAhorroSchema,
  }),
  actualizarMetaAhorroController,
);

metaAhorroRouter.delete(
  "/:id",
  validate({ params: metaAhorroIdSchema }),
  eliminarMetaAhorroController,
);
