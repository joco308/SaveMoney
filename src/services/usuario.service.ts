import { prisma } from "../config/prisma";
import type { usuario } from "../generated/prisma/client";

/**
 * Supabase Auth identifica al usuario con un UUID (`sub`), mientras que la
 * tabla `usuario` usa un BigInt autoincremental. Hasta que exista una columna
 * `auth_user_id`, el vínculo se hace por el email verificado del JWT.
 */
export async function findUsuarioByEmail(email: string): Promise<usuario | null> {
  return prisma.usuario.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}

export async function getUsuarioById(idUsuario: bigint): Promise<usuario | null> {
  return prisma.usuario.findUnique({
    where: { id_usuario: idUsuario },
  });
}

export type PublicUsuario = Omit<usuario, "hash_contrasena">;

export function toPublicUsuario(value: usuario): PublicUsuario {
  const { hash_contrasena: _hashContrasena, ...publicUsuario } = value;
  return publicUsuario;
}
