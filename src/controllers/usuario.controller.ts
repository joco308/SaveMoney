import type { RequestHandler } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import { toPublicUsuario } from "../services/usuario.service";
import { ApiError } from "../types/api-error";

export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.usuario) {
    throw ApiError.unauthorized();
  }

  res.status(200).json({
    success: true,
    data: toPublicUsuario(req.usuario),
  });
});
