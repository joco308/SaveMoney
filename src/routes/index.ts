import { Router } from "express";
import { healthRouter } from "./health.routes";
import { usuarioRouter } from "./usuario.routes";
import { categoriaRouter } from "./categoria.routes";
import { authRouter } from "./auth.routes";
import { movimientoRouter } from "./movimiento.routes";
import { emprendimientoRouter } from "./emprendimiento.routes";
import { presupuestoRouter } from "./presupuesto.routes";
import { metaAhorroRouter } from "./meta-ahorro.routes";
import { compraImpulsivaRouter } from "./compra-impulsiva.routes";
import { alertaRouter } from "./alerta.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/", usuarioRouter);
apiRouter.use("/categorias", categoriaRouter);
apiRouter.use("/movimientos", movimientoRouter);
apiRouter.use("/emprendimientos", emprendimientoRouter);
apiRouter.use("/presupuestos", presupuestoRouter);

apiRouter.use("/metas-ahorro", metaAhorroRouter);

apiRouter.use("/compras-impulsivas", compraImpulsivaRouter);

apiRouter.use("/alertas", alertaRouter);
