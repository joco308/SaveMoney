import { Router } from "express";
import {
  requireAuth,
  requireUsuario,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  alertaIdSchema,
  listarAlertasSchema,
} from "../schemas/alerta.schema";
import {
  listarAlertasController,
  obtenerAlertaController,
  marcarAlertaLeidaController,
  marcarTodasLeidasController,
  eliminarAlertaController,
} from "../controllers/alerta.controller";

export const alertaRouter = Router();

alertaRouter.use(requireAuth, requireUsuario);

alertaRouter.get(
  "/",
  validate({ query: listarAlertasSchema }),
  listarAlertasController,
);

alertaRouter.patch(
  "/leer-todas",
  marcarTodasLeidasController,
);

alertaRouter.get(
  "/:id",
  validate({ params: alertaIdSchema }),
  obtenerAlertaController,
);

alertaRouter.patch(
  "/:id/leer",
  validate({ params: alertaIdSchema }),
  marcarAlertaLeidaController,
);

alertaRouter.delete(
  "/:id",
  validate({ params: alertaIdSchema }),
  eliminarAlertaController,
);
