import { Router } from "express";
import {
  requireAuth,
  requireUsuario,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  movimientoIdSchema,
  listarMovimientosSchema,
  crearMovimientoSchema,
  actualizarMovimientoSchema,
} from "../schemas/movimiento.schema";
import {
  listarMovimientosController,
  obtenerMovimientoController,
  crearMovimientoController,
  actualizarMovimientoController,
  eliminarMovimientoController,
} from "../controllers/movimiento.controller";

export const movimientoRouter = Router();

movimientoRouter.use(requireAuth, requireUsuario);

movimientoRouter.get(
  "/",
  validate({ query: listarMovimientosSchema }),
  listarMovimientosController,
);

movimientoRouter.get(
  "/:id",
  validate({ params: movimientoIdSchema }),
  obtenerMovimientoController,
);

movimientoRouter.post(
  "/",
  validate({ body: crearMovimientoSchema }),
  crearMovimientoController,
);

movimientoRouter.put(
  "/:id",
  validate({
    params: movimientoIdSchema,
    body: actualizarMovimientoSchema,
  }),
  actualizarMovimientoController,
);

movimientoRouter.delete(
  "/:id",
  validate({ params: movimientoIdSchema }),
  eliminarMovimientoController,
);
