import { Router } from "express";
import { requireAuth, requireUsuario } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  categoriaIdSchema,
  listarCategoriasSchema,
  crearCategoriaSchema,
  actualizarCategoriaSchema,
  cambiarEstadoCategoriaSchema,
} from "../schemas/categoria.schema";
import {
  listarCategoriasController,
  obtenerCategoriaController,
  crearCategoriaController,
  actualizarCategoriaController,
  cambiarEstadoCategoriaController,
  eliminarCategoriaController,
} from "../controllers/categoria.controller";

export const categoriaRouter = Router();

categoriaRouter.use(requireAuth, requireUsuario);

categoriaRouter.get(
  "/",
  validate({ query: listarCategoriasSchema }),
  listarCategoriasController,
);

categoriaRouter.get(
  "/:id",
  validate({ params: categoriaIdSchema }),
  obtenerCategoriaController,
);

categoriaRouter.post(
  "/",
  validate({ body: crearCategoriaSchema }),
  crearCategoriaController,
);

categoriaRouter.put(
  "/:id",
  validate({
    params: categoriaIdSchema,
    body: actualizarCategoriaSchema,
  }),
  actualizarCategoriaController,
);

categoriaRouter.patch(
  "/:id/estado",
  validate({
    params: categoriaIdSchema,
    body: cambiarEstadoCategoriaSchema,
  }),
  cambiarEstadoCategoriaController,
);

categoriaRouter.delete(
  "/:id",
  validate({ params: categoriaIdSchema }),
  eliminarCategoriaController,
);
