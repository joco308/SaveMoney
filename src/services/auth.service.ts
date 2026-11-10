import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { SignJWT } from "jose";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import type { usuario } from "../generated/prisma/client";
import { ApiError } from "../types/api-error";
import { findUsuarioByEmail } from "./usuario.service";

const jwtSecret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface AuthSuccess {
  usuario: usuario;
  session: AuthSession;
}

/**
 * Normaliza hashes bcrypt con variantes $2y$ (PHP) a $2b$ antes de comparar.
 * bcryptjs no entiende $2y$, pero acepta $2a$/$2b$ sin problema.
 */
function normalizeBcryptHash(storedHash: string): string {
  return storedHash.startsWith("$2y$") ? `$2b$${storedHash.slice(4)}` : storedHash;
}

function hashRefreshToken(refreshToken: string): string {
  return createHash("sha256").update(refreshToken).digest("hex");
}

async function signAccessToken(usuario: usuario): Promise<string> {
  return new SignJWT({
    email: usuario.email,
    typ: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuario.id_usuario.toString())
    .setIssuer(env.AUTH_JWT_ISSUER)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime(`${env.AUTH_ACCESS_TOKEN_TTL}s`)
    .sign(jwtSecret);
}

async function createSession(usuarioId: bigint): Promise<AuthSuccess> {
  const usuario = (await prisma.usuario.findUniqueOrThrow({
    where: { id_usuario: usuarioId },
  })) as usuario;

  const refreshToken = randomBytes(32).toString("base64url");
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiraEn = new Date(Date.now() + env.AUTH_REFRESH_TOKEN_TTL * 1000);

  await prisma.sesion_usuario.create({
    data: {
      id_usuario: usuario.id_usuario,
      refresh_token_hash: refreshTokenHash,
      expira_en: expiraEn,
    },
  });

  const accessToken = await signAccessToken(usuario);

  return {
    usuario,
    session: {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: env.AUTH_ACCESS_TOKEN_TTL,
    },
  };
}

export async function login(email: string, password: string): Promise<AuthSuccess> {
  const usuario = await findUsuarioByEmail(email);

  if (!usuario || !usuario.activo) {
    // Compare dummy para no filtrar si existe el email ni el estado del usuario.
    await comparePassword(password, null);
    return Promise.reject(ApiError.unauthorized("Credenciales inválidas"));
  }

  const valid = await comparePassword(password, usuario.hash_contrasena);

  if (!valid) {
    return Promise.reject(ApiError.unauthorized("Credenciales inválidas"));
  }

  return createSession(usuario.id_usuario);
}

export async function refresh(refreshToken: string): Promise<AuthSuccess> {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const now = new Date();

  const sesion = await prisma.sesion_usuario.findUnique({
    where: { refresh_token_hash: refreshTokenHash },
    include: { usuario: true },
  });

  if (!sesion || sesion.revocada_en !== null || sesion.expira_en <= now || !sesion.usuario.activo) {
    throw ApiError.unauthorized("Sesión inválida o expirada");
  }

  const newRefreshToken = randomBytes(32).toString("base64url");
  const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + env.AUTH_REFRESH_TOKEN_TTL * 1000);

  /** Rotación atómica: solo rota si nadie más lo hizo antes (`revocada_en` sigue null). */
  const rotated = await prisma.sesion_usuario.updateMany({
    where: {
      refresh_token_hash: refreshTokenHash,
      revocada_en: null,
    },
    data: {
      refresh_token_hash: newRefreshTokenHash,
      expira_en: newExpiresAt,
      actualizada_en: now,
    },
  });

  if (rotated.count === 0) {
    throw ApiError.unauthorized("Sesión inválida o expirada");
  }

  const accessToken = await signAccessToken(sesion.usuario);

  return {
    usuario: sesion.usuario,
    session: {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: "bearer",
      expires_in: env.AUTH_ACCESS_TOKEN_TTL,
    },
  };
}

export async function logout(refreshToken: string): Promise<void> {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await prisma.sesion_usuario.updateMany({
    where: {
      refresh_token_hash: refreshTokenHash,
      revocada_en: null,
    },
    data: {
      revocada_en: new Date(),
    },
  });
}

/**
 * Dummy bcrypt hash used to avoid timing side-channels when the email does
 * not exist or the stored hash is invalid. Generated over a constant string.
 */
const DUMMY_HASH: Promise<string> = hash("timing-mitigation-dummy", 10);

export async function comparePassword(password: string, storedHash: string | null): Promise<boolean> {
  if (!storedHash) {
    await compare(password, await DUMMY_HASH).catch(() => false);
    return false;
  }

  try {
    return await compare(password, normalizeBcryptHash(storedHash));
  } catch {
    return false;
  }
}
