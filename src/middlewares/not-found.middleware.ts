import type { RequestHandler } from "express";
import { ApiError } from "../types/api-error";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};
