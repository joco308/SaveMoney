import { Router } from "express";
import {
  requireAuth,
  requireUsuario,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  presupuestoIdSchema,
  presupuestoCategoriaParamsSchema,
  listarPresupuestosSchema,
  crearPresupuestoSchema,
  actualizarPresupuestoSchema,
  crearPresupuestoCategoriaSchema,
  actualizarPresupuestoCategoriaSchema,
} from "../schemas/presupuesto.schema";
import {
  listarPresupuestosController,
  obtenerPresupuestoController,
  crearPresupuestoController,
  actualizarPresupuestoController,
  eliminarPresupuestoController,
  agregarLimiteCategoriaController,
  actualizarLimiteCategoriaController,
  eliminarLimiteCategoriaController,
} from "../controllers/presupuesto.controller";

export const presupuestoRouter = Router();

presupuestoRouter.use(requireAuth, requireUsuario);

presupuestoRouter.get(
  "/",
  validate({ query: listarPresupuestosSchema }),
  listarPresupuestosController,
);

presupuestoRouter.get(
  "/:id",
  validate({ params: presupuestoIdSchema }),
  obtenerPresupuestoController,
);

presupuestoRouter.post(
  "/",
  validate({ body: crearPresupuestoSchema }),
  crearPresupuestoController,
);

presupuestoRouter.put(
  "/:id",
  validate({
    params: presupuestoIdSchema,
    body: actualizarPresupuestoSchema,
  }),
  actualizarPresupuestoController,
);

presupuestoRouter.delete(
  "/:id",
  validate({ params: presupuestoIdSchema }),
  eliminarPresupuestoController,
);

presupuestoRouter.post(
  "/:id/categorias",
  validate({
    params: presupuestoIdSchema,
    body: crearPresupuestoCategoriaSchema,
  }),
  agregarLimiteCategoriaController,
);

presupuestoRouter.put(
  "/:id/categorias/:idLimite",
  validate({
    params: presupuestoCategoriaParamsSchema,
    body: actualizarPresupuestoCategoriaSchema,
  }),
  actualizarLimiteCategoriaController,
);

presupuestoRouter.delete(
  "/:id/categorias/:idLimite",
  validate({ params: presupuestoCategoriaParamsSchema }),
  eliminarLimiteCategoriaController,
);
