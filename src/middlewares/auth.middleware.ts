import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env";
import { getUsuarioById } from "../services/usuario.service";
import { ApiError } from "../types/api-error";

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Debes enviar un token Bearer");
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw ApiError.unauthorized("El token está vacío");
    }

    const { payload } = await jwtVerify(token, jwtSecret, {
      algorithms: ["HS256"],
      issuer: "savemoney-api",
      audience: "savemoney-client",
    });

    if (
      typeof payload.sub !== "string" ||
      payload.token_use !== "access"
    ) {
      throw ApiError.unauthorized("Token inválido");
    }

    req.auth = {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      token_use: "access",
    };

    next();
  } catch {
    next(ApiError.unauthorized("Token inválido, expirado o no autorizado"));
  }
};

export const requireUsuario: RequestHandler = async (req, _res, next) => {
  try {
    const sub = req.auth?.sub;

    if (!sub || !/^\d+$/.test(sub)) {
      throw ApiError.unauthorized("Identificador de usuario inválido");
    }

    const usuario = await getUsuarioById(BigInt(sub));

    if (!usuario) {
      throw ApiError.unauthorized("El usuario no existe");
    }

    if (!usuario.activo) {
      throw ApiError.forbidden("Tu cuenta se encuentra desactivada");
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
};