import type { RequestHandler } from "express";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { env } from "../config/env";
import { findUsuarioByEmail } from "../services/usuario.service";
import { ApiError } from "../types/api-error";

const supabaseBaseUrl = env.SUPABASE_URL?.replace(/\/+$/, "");
const issuer = supabaseBaseUrl ? `${supabaseBaseUrl}/auth/v1` : undefined;
const jwksUrl =
  env.SUPABASE_JWKS_URL ??
  (supabaseBaseUrl ? `${supabaseBaseUrl}/auth/v1/.well-known/jwks.json` : undefined);

const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : undefined;
const jwtSecret = env.SUPABASE_JWT_SECRET
  ? new TextEncoder().encode(env.SUPABASE_JWT_SECRET)
  : undefined;

/**
 * Verifica el access token de Supabase y deja el contexto en `req.auth`.
 * Soporta claves asimétricas (JWKS) y el secreto HS256 legacy.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Falta el header Authorization: Bearer <token>");
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      throw ApiError.unauthorized("Token vacío");
    }

    const { alg } = decodeProtectedHeader(token);
    const key = alg === "HS256" && jwtSecret ? jwtSecret : (jwks ?? jwtSecret);
    if (!key) {
      throw ApiError.unauthorized("No hay una clave configurada para validar el JWT");
    }

    const { payload } = await jwtVerify(token, key, {
      issuer,
      audience: "authenticated",
    });

    if (!payload.sub) {
      throw ApiError.unauthorized("El token no contiene el claim sub");
    }

    req.auth = {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    next(ApiError.unauthorized("Token inválido o expirado"));
  }
};

/**
 * Resuelve el usuario de la aplicación a partir del email del JWT y lo deja
 * en `req.usuario`. Los servicios deben seguir filtrando por `id_usuario`.
 */
export const requireUsuario: RequestHandler = async (req, _res, next) => {
  try {
    const email = req.auth?.email;
    if (!email) {
      throw ApiError.unauthorized("El token no incluye un email");
    }

    const usuario = await findUsuarioByEmail(email);
    if (!usuario) {
      throw ApiError.forbidden("No existe un usuario de SaveMoney asociado a este email");
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
