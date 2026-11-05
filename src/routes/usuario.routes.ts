import { Router } from "express";
import { getMe } from "../controllers/usuario.controller";
import { requireAuth, requireUsuario } from "../middlewares/auth.middleware";

export const usuarioRouter = Router();

usuarioRouter.get("/me", requireAuth, requireUsuario, getMe);
