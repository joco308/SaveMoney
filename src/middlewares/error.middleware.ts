import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiError } from "../types/api-error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Datos de entrada inválidos",
        details: error.issues,
      },
    });
    return;
  }

  console.error("[error]", error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "Error interno del servidor"
          : error instanceof Error
            ? error.message
            : "Error interno del servidor",
      details: [],
    },
  });
};
