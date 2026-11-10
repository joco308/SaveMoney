import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env";
import { getUsuarioById } from "../services/usuario.service";
import { ApiError } from "../types/api-error";

const jwtSecret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

/**
 * Verifica el access token local (HS256) y deja el contexto en `req.auth`.
 * El `sub` es el `id_usuario` de SaveMoney (BigInt), no un UUID de Supabase.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Falta el header Authorization: Bearer <token>"));
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    next(ApiError.unauthorized("Token vacío"));
    return;
  }

  void jwtVerify(token, jwtSecret, {
    issuer: env.AUTH_JWT_ISSUER,
    audience: "authenticated",
  })
    .then(({ payload }) => {
      if (payload.typ !== "access") {
        next(ApiError.unauthorized("Tipo de token inválido"));
        return;
      }

      if (!payload.sub) {
        next(ApiError.unauthorized("El token no contiene el claim sub"));
        return;
      }

      req.auth = {
        sub: payload.sub,
        email: typeof payload.email === "string" ? payload.email : undefined,
      };

      next();
    })
    .catch(() => {
      next(ApiError.unauthorized("Token inválido o expirado"));
    });
};

/**
 * Resuelve el usuario de la aplicación a partir del `sub` del access token
 * local (el `id_usuario` de SaveMoney) y lo deja en `req.usuario`.
 * Los servicios deben seguir filtrando por `id_usuario`.
 */
export const requireUsuario: RequestHandler = async (req, _res, next) => {
  try {
    const sub = req.auth?.sub;
    if (!sub) {
      throw ApiError.unauthorized("El token no contiene el claim sub");
    }

    let idUsuario: bigint;
    try {
      idUsuario = BigInt(sub);
    } catch {
      throw ApiError.unauthorized("El claim sub no es un id_usuario válido");
    }

    const usuario = await getUsuarioById(idUsuario);
    if (!usuario) {
      throw ApiError.forbidden("No existe un usuario de SaveMoney asociado a este id");
    }
    if (!usuario.activo) {
      throw ApiError.forbidden("El usuario está inactivo");
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
};
