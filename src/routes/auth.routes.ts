import { Router } from "express";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  authMeController,
} from "../controllers/auth.controller";
import {
  requireAuth,
  requireUsuario,
} from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", requireAuth, logoutController);
authRouter.get("/me", requireAuth, requireUsuario, authMeController);