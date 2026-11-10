import { Router } from "express";
import { loginHandler, logoutHandler, refreshHandler } from "../controllers/auth.controller";
import { loginSchema, logoutSchema, refreshSchema } from "../schemas/auth.schema";
import { validate } from "../middlewares/validate.middleware";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginSchema }), loginHandler);
authRouter.post("/refresh", validate({ body: refreshSchema }), refreshHandler);
authRouter.post("/logout", validate({ body: logoutSchema }), logoutHandler);
