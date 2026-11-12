import { prisma } from "../config/prisma";
import type { usuario } from "../generated/prisma/client";

export async function findUsuarioByEmail(
  email: string,
): Promise<usuario | null> {
  return prisma.usuario.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });
}

export async function getUsuarioById(
  idUsuario: bigint,
): Promise<usuario | null> {
  return prisma.usuario.findUnique({
    where: {
      id_usuario: idUsuario,
    },
  });
}

export type PublicUsuario = Omit<
  usuario,
  "hash_contrasena" | "id_usuario"
> & {
  id_usuario: string;
};

export function toPublicUsuario(value: usuario): PublicUsuario {
  const {
    hash_contrasena: _hashContrasena,
    id_usuario,
    ...publicUsuario
  } = value;

  return {
    ...publicUsuario,
    id_usuario: id_usuario.toString(),
  };
}