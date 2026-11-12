import { Router } from "express";
import {
  requireAuth,
  requireUsuario,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  emprendimientoIdSchema,
  listarEmprendimientosSchema,
  crearEmprendimientoSchema,
  actualizarEmprendimientoSchema,
  cambiarEstadoEmprendimientoSchema,
} from "../schemas/emprendimiento.schema";
import {
  listarEmprendimientosController,
  obtenerEmprendimientoController,
  crearEmprendimientoController,
  actualizarEmprendimientoController,
  cambiarEstadoEmprendimientoController,
  eliminarEmprendimientoController,
} from "../controllers/emprendimiento.controller";

export const emprendimientoRouter = Router();

emprendimientoRouter.use(requireAuth, requireUsuario);

emprendimientoRouter.get(
  "/",
  validate({ query: listarEmprendimientosSchema }),
  listarEmprendimientosController,
);

emprendimientoRouter.get(
  "/:id",
  validate({ params: emprendimientoIdSchema }),
  obtenerEmprendimientoController,
);

emprendimientoRouter.post(
  "/",
  validate({ body: crearEmprendimientoSchema }),
  crearEmprendimientoController,
);

emprendimientoRouter.put(
  "/:id",
  validate({
    params: emprendimientoIdSchema,
    body: actualizarEmprendimientoSchema,
  }),
  actualizarEmprendimientoController,
);

emprendimientoRouter.patch(
  "/:id/estado",
  validate({
    params: emprendimientoIdSchema,
    body: cambiarEstadoEmprendimientoSchema,
  }),
  cambiarEstadoEmprendimientoController,
);

emprendimientoRouter.delete(
  "/:id",
  validate({ params: emprendimientoIdSchema }),
  eliminarEmprendimientoController,
);
