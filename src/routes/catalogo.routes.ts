import { Router } from "express";
import { requireAuth, requireUsuario } from "../middlewares/auth.middleware";
import { obtener } from "../controllers/catalogo.controller";
export const router = Router();
router.get("/", requireAuth, requireUsuario, obtener);
