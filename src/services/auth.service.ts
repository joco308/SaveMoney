import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { ApiError } from "../types/api-error";
import {
  findUsuarioByEmail,
  toPublicUsuario,
} from "./usuario.service";

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);
const ACCESS_TTL = env.JWT_ACCESS_TTL_SECONDS;
const REFRESH_TTL = env.JWT_REFRESH_TTL_SECONDS;

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createAccessToken(
  idUsuario: bigint,
  email: string,
): Promise<string> {
  return new SignJWT({
    email,
    token_use: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(idUsuario.toString())
    .setIssuer("savemoney-api")
    .setAudience("savemoney-client")
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(jwtSecret);
}

async function createSession(idUsuario: bigint, email: string) {
  const accessToken = await createAccessToken(idUsuario, email);
  const refreshToken = randomBytes(48).toString("base64url");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_TTL * 1000);

  await prisma.sesion_usuario.create({
    data: {
      id_usuario: idUsuario,
      refresh_token_hash: hashRefreshToken(refreshToken),
      creada_en: now,
      actualizada_en: now,
      expira_en: expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TTL,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function registerUser(data: {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  codigo_moneda: string;
  telefono?: string;
  fecha_nacimiento?: string;
}) {
  const existingUser = await findUsuarioByEmail(data.email);

  if (existingUser) {
    throw new ApiError(409, "CONFLICT", "El correo electrónico ya está registrado");
  }

  const perfil = await prisma.perfil_usuario.findUnique({
    where: { id_perfil: 1 },
  });

  if (!perfil) {
    throw ApiError.badRequest(
      "No existe el perfil de usuario estándar (id_perfil = 1)",
    );
  }

  const moneda = await prisma.moneda.findUnique({
    where: { codigo_moneda: data.codigo_moneda },
  });

  if (!moneda) {
    throw ApiError.badRequest("La moneda seleccionada no está registrada");
  }

  const hashContrasena = await bcrypt.hash(data.password, 12);

  try {
    const usuario = await prisma.usuario.create({
      data: {
        id_perfil: 1,
        codigo_moneda: data.codigo_moneda,
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        hash_contrasena: hashContrasena,
        telefono: data.telefono,
        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(`${data.fecha_nacimiento}T00:00:00.000Z`)
          : null,
        activo: true,
        fecha_registro: new Date(),
      },
    });

    const tokens = await createSession(usuario.id_usuario, usuario.email);

    return {
      user: toPublicUsuario(usuario),
      ...tokens,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, "CONFLICT", "El correo electrónico ya está registrado");
    }

    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  const usuario = await findUsuarioByEmail(email);

  if (!usuario) {
    throw ApiError.unauthorized("Correo electrónico o contraseña incorrectos");
  }

  const passwordCorrecta = await bcrypt.compare(
    password,
    usuario.hash_contrasena,
  );

  if (!passwordCorrecta) {
    throw ApiError.unauthorized("Correo electrónico o contraseña incorrectos");
  }

  if (!usuario.activo) {
    throw ApiError.forbidden("Tu cuenta se encuentra desactivada");
  }

  const tokens = await createSession(usuario.id_usuario, usuario.email);

  return {
    user: toPublicUsuario(usuario),
    ...tokens,
  };
}

export async function refreshUserSession(refreshToken: string) {
  const oldHash = hashRefreshToken(refreshToken);

  const session = await prisma.sesion_usuario.findUnique({
    where: {
      refresh_token_hash: oldHash,
    },
    include: {
      usuario: true,
    },
  });

  if (!session || session.revocada_en || session.expira_en <= new Date()) {
    throw ApiError.unauthorized("La sesión ha expirado o fue revocada");
  }

  if (!session.usuario.activo) {
    throw ApiError.forbidden("Tu cuenta se encuentra desactivada");
  }

  const newRefreshToken = randomBytes(48).toString("base64url");
  const newHash = hashRefreshToken(newRefreshToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_TTL * 1000);

  const accessToken = await createAccessToken(
    session.usuario.id_usuario,
    session.usuario.email,
  );

  const updated = await prisma.sesion_usuario.updateMany({
    where: {
      id_sesion: session.id_sesion,
      refresh_token_hash: oldHash,
      revocada_en: null,
      expira_en: { gt: now },
    },
    data: {
      refresh_token_hash: newHash,
      actualizada_en: now,
      expira_en: expiresAt,
    },
  });

  if (updated.count !== 1) {
    throw ApiError.unauthorized("El refresh token ya fue utilizado o revocado");
  }

  return {
    user: toPublicUsuario(session.usuario),
    accessToken,
    refreshToken: newRefreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TTL,
  };
}

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.sesion_usuario.updateMany({
    where: {
      refresh_token_hash: tokenHash,
      revocada_en: null,
    },
    data: {
      revocada_en: new Date(),
      actualizada_en: new Date(),
    },
  });

  return {
    message: "Sesión cerrada correctamente",
  };
}