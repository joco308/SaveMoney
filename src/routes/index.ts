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
