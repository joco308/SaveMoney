import { router as emprendimientoRouter } from "./emprendimiento.routes";
import { router as presupuestoRouter } from "./presupuesto.routes";
import { router as meta_ahorroRouter } from "./meta_ahorro.routes";
import { router as aporte_metaRouter } from "./aporte_meta.routes";
import { router as presupuesto_categoriaRouter } from "./presupuesto_categoria.routes";
import { router as compra_impulsivaRouter } from "./compra_impulsiva.routes";
import { router as catalogoRouter } from "./catalogo.routes";
import { router as alertaRouter } from "./alerta.routes";
import { Router } from "express";
import { healthRouter } from "./health.routes";
import { usuarioRouter } from "./usuario.routes";
import { categoriaRouter } from "./categoria.routes";
import { authRouter } from "./auth.routes";
import { movimientoRouter } from "./movimiento.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/", usuarioRouter);
apiRouter.use("/categorias", categoriaRouter);
apiRouter.use("/movimientos", movimientoRouter);

apiRouter.use("/emprendimientos", emprendimientoRouter);
apiRouter.use("/presupuestos", presupuestoRouter);
apiRouter.use("/metas", meta_ahorroRouter);
apiRouter.use("/metas/:parentId/aportes", aporte_metaRouter);
apiRouter.use("/presupuestos/:parentId/limites", presupuesto_categoriaRouter);
apiRouter.use("/compras-impulsivas", compra_impulsivaRouter);
apiRouter.use("/catalogos", catalogoRouter);
apiRouter.use("/alertas", alertaRouter);
