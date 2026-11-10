import type { RequestHandler } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import { login, logout, refresh } from "../services/auth.service";
import { toPublicUsuario } from "../services/usuario.service";
import { loginSchema, logoutSchema, refreshSchema } from "../schemas/auth.schema";

export const loginHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const auth = await login(email, password);

  res.status(200).json({
    success: true,
    data: {
      usuario: toPublicUsuario(auth.usuario),
      session: auth.session,
    },
  });
});

export const refreshHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { refresh_token } = refreshSchema.parse(req.body);

  const auth = await refresh(refresh_token);

  res.status(200).json({
    success: true,
    data: {
      usuario: toPublicUsuario(auth.usuario),
      session: auth.session,
    },
  });
});

export const logoutHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { refresh_token } = logoutSchema.parse(req.body);

  await logout(refresh_token);

  res.status(204).send();
});
