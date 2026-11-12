import { Router } from "express";
import {
  requireAuth,
  requireUsuario,
} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  compraImpulsivaIdSchema,
  listarComprasImpulsivasSchema,
  crearCompraImpulsivaSchema,
  actualizarCompraImpulsivaSchema,
  comprarCompraImpulsivaSchema,
} from "../schemas/compra-impulsiva.schema";
import {
  listarComprasImpulsivasController,
  obtenerCompraImpulsivaController,
  crearCompraImpulsivaController,
  actualizarCompraImpulsivaController,
  comprarCompraImpulsivaController,
  descartarCompraImpulsivaController,
  eliminarCompraImpulsivaController,
} from "../controllers/compra-impulsiva.controller";

export const compraImpulsivaRouter = Router();

compraImpulsivaRouter.use(requireAuth, requireUsuario);

compraImpulsivaRouter.get(
  "/",
  validate({ query: listarComprasImpulsivasSchema }),
  listarComprasImpulsivasController,
);

compraImpulsivaRouter.get(
  "/:id",
  validate({ params: compraImpulsivaIdSchema }),
  obtenerCompraImpulsivaController,
);

compraImpulsivaRouter.post(
  "/",
  validate({ body: crearCompraImpulsivaSchema }),
  crearCompraImpulsivaController,
);

compraImpulsivaRouter.put(
  "/:id",
  validate({
    params: compraImpulsivaIdSchema,
    body: actualizarCompraImpulsivaSchema,
  }),
  actualizarCompraImpulsivaController,
);

compraImpulsivaRouter.post(
  "/:id/comprar",
  validate({
    params: compraImpulsivaIdSchema,
    body: comprarCompraImpulsivaSchema,
  }),
  comprarCompraImpulsivaController,
);

compraImpulsivaRouter.post(
  "/:id/descartar",
  validate({ params: compraImpulsivaIdSchema }),
  descartarCompraImpulsivaController,
);

compraImpulsivaRouter.delete(
  "/:id",
  validate({ params: compraImpulsivaIdSchema }),
  eliminarCompraImpulsivaController,
);
